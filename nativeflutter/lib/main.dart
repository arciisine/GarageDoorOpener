import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'firebase_options.dart';
import 'dart:async';

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
  Stream<DatabaseEvent>? stream;
  StreamSubscription<DatabaseEvent>? subscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    DatabaseReference ref = FirebaseDatabase.instance.ref().child('/Image');
    this.stream = ref.onValue;
    // Subscribe to the stream!
    this.subscription = this.stream?.listen((DatabaseEvent event) {
      print('Image updated : ${event.snapshot.value}');
      this.imageUrl = event.snapshot.value as String?;
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
    this.subscription?.cancel();
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
            child: new StreamBuilder<DatabaseEvent>(
              stream: this.stream,
              builder: (context, snapshot) {
                final imageUrl = snapshot.data?.snapshot.value as String?;
                return new Image.network(
                  imageUrl ?? '',
                  key: ValueKey(imageUrl ?? ''),
                  fit: BoxFit.fitWidth,
                  gaplessPlayback: true,
                );
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
