import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:async';
import 'dart:developer';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
        future: Firebase.initializeApp(),
        builder: (context, snapshot) {
          SystemChrome.setPreferredOrientations([
            DeviceOrientation.landscapeLeft,
            DeviceOrientation.landscapeRight,
          ]);

          return MaterialApp(
            title: 'Garage Door Opener',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              // This is the theme of your application.
              //
              // Try running your application with "flutter run". You'll see the
              // application has a blue toolbar. Then, without quitting the app, try
              // changing the primarySwatch below to Colors.green and then invoke
              // "hot reload" (press "r" in the console where you ran "flutter run",
              // or simply save your changes to "hot reload" in a Flutter IDE).
              // Notice that the counter didn't reset back to zero; the application
              // is not restarted.
              primarySwatch: Colors.blue,
            ),
            home: new Scaffold(body: GarageInterface()),
          );
        });
  }
}

class GarageInterface extends StatefulWidget {
  GarageInterface({Key? key, this.title}) : super(key: key);

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String? title;

  @override
  _GarageInterfaceState createState() => _GarageInterfaceState();
}

class _GarageInterfaceState extends State<GarageInterface>
    with WidgetsBindingObserver {
  static String ip = '192.168.1.168';
  static String appId = 'garagedoorapp-1d1fe.appspot.com';
  static const platform = const MethodChannel('app.channel.shared.intent');

  static getImageUrl() {
    final now = new DateTime.now().millisecondsSinceEpoch;
    final url =
        'https://storage.googleapis.com/${appId}/images/door-snap.jpg?cache=${now}';
    print(url);
    return url;
  }

  int lastSent = 0;
  String? imageUrl;

  GoogleSignIn? _googleSignIn;
  FirebaseAuth? _firebaseauth;
  User? user;
  Timer? _timer;
  Future<void>? authFuture;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    this.imageUrl = getImageUrl();
    checkIntent();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    print('Did CHange App Lifecycle State ${state}\n');
    if (state == AppLifecycleState.resumed) {
      checkIntent();
      runSnapshot();
    } else {
      stopSnapshot();
    }
  }

  stopSnapshot() {
    if (_timer != null) {
      var old = _timer;
      _timer = null;
      old?.cancel();
    }
  }

  runSnapshot() {
    if (_timer == null) {
      _timer = Timer.periodic(Duration(seconds: 2), (timer) {
        setState(() {
          imageUrl = getImageUrl();
        });
      });
    }
  }

  checkIntent() async {
    // var voiced = await platform.invokeMethod("voiceLaunch");
    // if (voiced == 'true') {
    //   activate();
    // }
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
    this._googleSignIn = this._googleSignIn ?? GoogleSignIn();
    this._firebaseauth = this._firebaseauth ?? FirebaseAuth.instance;

    GoogleSignInAccount? googleUser = await _googleSignIn?.signIn();
    GoogleSignInAuthentication? googleAuth = await googleUser?.authentication;

    final AuthCredential credential = GoogleAuthProvider.credential(
      accessToken: googleAuth?.accessToken,
      idToken: googleAuth?.idToken,
    );
    UserCredential? cred = await _firebaseauth?.signInWithCredential(credential);

    this.user = cred?.user;
    this.authFuture = null;
  }

  sendMessage(String key, String value) async {
    await this.auth();
    FirebaseDatabase.instance.reference().child('/${key}').set(value);
    this.lastSent = DateTime.now().millisecondsSinceEpoch;
  }

  Future<void> activate() async {
    if (DateTime.now().millisecondsSinceEpoch < (this.lastSent + 1000)) {
      // Don't double send
      return;
    }
    try {
      await this
          .sendMessage('Activate', '${DateTime.now().millisecondsSinceEpoch}');
    } catch (e) {
      print("Failed to write");
      print(e);
      // fallback if firebase is down
      await http.post(Uri.http(ip, '/activate'));
    }
  }

  @override
  Widget build(BuildContext context) {
    runSnapshot();

    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      body: new Row(
        children: [
          new Expanded(
              /*or Column*/
              child: new Image.network(imageUrl ?? '',
                  fit: BoxFit.fitWidth, gaplessPlayback: true)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        child: Icon(Icons.directions_run),
        onPressed: () async {
          await activate();
          var snackbar = SnackBar(
              content: Text('Request sent'), duration: Duration(seconds: 2));
          ScaffoldMessenger.of(context).showSnackBar(snackbar);
        },
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}
