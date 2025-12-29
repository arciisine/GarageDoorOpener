import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'firebase_options.dart';
import 'dart:async';
import 'package:rxdart/transformers.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await GoogleSignIn.instance.initialize(
    serverClientId: DefaultFirebaseOptions.FirebaseServerClientId,
  );
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);

    return MaterialApp(
      title: 'Garage Door Opener',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.blue),
      home: new Scaffold(body: GarageInterface()),
    );
  }
}

class GarageInterface extends StatefulWidget {
  GarageInterface({Key? key, this.title}) : super(key: key);

  final String? title;

  @override
  _GarageInterfaceState createState() => _GarageInterfaceState();
}

class _GarageInterfaceState extends State<GarageInterface>
    with WidgetsBindingObserver {
  static String ip = '192.168.87.42';

  String? imageUrl;
  User? user;
  Future<void>? authFuture;
  Stream<Image>? stream;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    DatabaseReference ref = FirebaseDatabase.instance.ref().child('/Image');
    this.stream = ref.onValue
        .throttleTime(Duration(milliseconds: 500), trailing: true)
        .asyncMap((DatabaseEvent event) async {
          final imageUrl = event.snapshot.value as String;
          Uint8List bytes = (await NetworkAssetBundle(
            Uri.parse(imageUrl),
          ).load(imageUrl)).buffer.asUint8List();
          return Image.memory(bytes, fit: BoxFit.fitWidth);
        });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  auth() async {
    if (this.user == null) {
      if (this.authFuture == null) {
        this.authFuture = this._auth();
        this.authFuture?.catchError((err) {
          this.authFuture = null;
          print(err);
        });
      }
      return await this.authFuture;
    }
  }

  _auth() async {
    final googleUser = await GoogleSignIn.instance.authenticate();
    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      idToken: googleAuth.idToken,
    );
    final cred = await FirebaseAuth.instance.signInWithCredential(credential);
    this.user = cred.user;
    this.authFuture = null;
  }

  sendMessage(String key, String value) async {
    await this.auth();
    FirebaseDatabase.instance.ref().child('/${key}').set(value);
  }

  Future<void> trigger() async {
    try {
      await this.sendMessage(
        'Activate',
        '${DateTime.now().millisecondsSinceEpoch}',
      );
    } catch (e) {
      print("Failed to write");
      print(e);
      // fallback if firebase is down
      await http.post(Uri.http(ip, '/activate'));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: new Row(
        children: [
          new Expanded(
            child: new StreamBuilder<Image>(
              stream: this.stream,
              builder: (context, snapshot) {
                return snapshot.hasData
                    ? snapshot.data!
                    : Center(child: CircularProgressIndicator());
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        child: Icon(Icons.directions_run),
        onPressed: () async {
          await trigger();
          var snackbar = SnackBar(
            content: Text('Request sent'),
            duration: Duration(seconds: 2),
          );
          ScaffoldMessenger.of(context).showSnackBar(snackbar);
        },
      ),
    );
  }
}
