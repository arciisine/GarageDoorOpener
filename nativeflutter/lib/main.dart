import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:device_id/device_id.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

void main() async {
  final fbapp = await FirebaseApp.configure(
    name: 'db2',
    options: const FirebaseOptions(
      googleAppID: '1:297855924061:android:669871c998cc21bd',
      apiKey: 'AIzaSyD_shO5mfO9lhy2TVWhfo1VUmARKlG4suk',
      databaseURL: 'https://flutterfire-cd2f7.firebaseio.com',
    ),
  );
  runApp(MyApp(app: fbapp));
}

class MyApp extends StatelessWidget {
  final FirebaseApp app;
  MyApp({this.app});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);

    return MaterialApp(
      title: 'Garage Door Opener',
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
      home: GarageInterface(),
    );
  }
}

class GarageInterface extends StatefulWidget {
  GarageInterface({Key key, this.title}) : super(key: key);

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String title;

  @override
  _GarageInterfaceState createState() => _GarageInterfaceState();
}

class _GarageInterfaceState extends State<GarageInterface> {
  static String ip = '192.168.1.168';
  static String appId = 'garagedoorapp-1d1fe.appspot.com';

  static getImageUrl() {
    final now = new DateTime.now().millisecondsSinceEpoch;
    final url =
        'https://storage.googleapis.com/${appId}/images/door-snap.jpg?cache=${now}';
    print(url);
    return url;
  }

  int lastSent = 0;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final FirebaseAuth _firebaseauth = FirebaseAuth.instance;
  String imageUrl = getImageUrl();
  FirebaseUser user;

  Future<void> authFuture;
  bool imageLoading = false;

  auth() async {
    if (this.user == null) {
      if (this.authFuture == null) {
        this.authFuture = this._auth();
      }
      return await this.authFuture;
    }
  }

  _auth() async {
    String deviceId = await DeviceId.getID;

    GoogleSignInAccount googleUser = await _googleSignIn.signIn();
    GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    FirebaseUser user = await _firebaseauth.signInWithGoogle(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    // get email here
    try {
      await _firebaseauth.signInWithEmailAndPassword(
          email: user.email, password: deviceId);
      this.user = user;
    } catch (e) {}

    this.authFuture = null;

    print("signed in " + user.email + " " + deviceId);
  }

  loadSnapshot() async {
    if (this.imageLoading) {
      return;
    }

    this.imageLoading = true;

    while (this.imageLoading) {
      print('Loading Image');
      setState(() {
        imageUrl = getImageUrl();
      });
      await Future.delayed(const Duration(milliseconds: 2000));
    }
  }

  sendMessage(String key, String value) async {
    try {
      await FirebaseAuth.instance.currentUser();
    } catch (e) {
      await this.auth();
    }

    FirebaseDatabase.instance
        .reference()
        .child('/${key}')
        .set(value == null ? 'true' : value);
    this.lastSent = DateTime.now().millisecondsSinceEpoch;
  }

  toggle() async {
    if (DateTime.now().millisecondsSinceEpoch < (this.lastSent + 1000)) {
      // Don't double send
      return;
    }
    try {
      await this.sendMessage('Activate', null);
    } catch (e) {
      // fallback if firebase is down
      await http.post('http://${ip}/activate');
    }
  }

  @override
  Widget build(BuildContext context) {
    loadSnapshot();

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
              child: new Image.network(imageUrl,
                  fit: BoxFit.fitWidth, gaplessPlayback: true)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        child: Icon(Icons.directions_run),
        onPressed: toggle,
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}