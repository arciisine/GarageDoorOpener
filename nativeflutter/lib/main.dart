import 'firebase_options.dart';
import 'dart:async';

import 'package:GarageDoorOpener/cross_fade.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:rxdart/transformers.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

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
  StreamSubscription<User?>? authSubscription;
  StreamSubscription<List<ConnectivityResult>>? connectivitySubscription;
  StreamSubscription<RemoteMessage>? messageSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    this._initializeFirebaseMessaging();

    // Listen to auth state changes for persistence
    authSubscription = FirebaseAuth.instance.authStateChanges().listen((
      User? user,
    ) {
      setState(() {
        this.user = user;
      });
    });

    // Reset connection on connectivity changes
    connectivitySubscription = Connectivity().onConnectivityChanged.listen((
      List<ConnectivityResult> result,
    ) async {
      print("Connectivity changed, resetting connection");
      await FirebaseDatabase.instance.goOffline();
      await FirebaseDatabase.instance.goOnline();
    });

    DatabaseReference databaseReference = FirebaseDatabase.instance.ref().child('/Image');
    this.stream = databaseReference.onValue
        .throttleTime(Duration(milliseconds: 500), trailing: true)
        .asyncMap((DatabaseEvent event) async {
          final imageUrl = event.snapshot.value as String;
          Uint8List imageBytes = (await NetworkAssetBundle(
            Uri.parse(imageUrl),
          ).load(imageUrl)).buffer.asUint8List();
          return Image.memory(imageBytes, fit: BoxFit.fill);
        });
  }

  Future<void> _initializeFirebaseMessaging() async {
    try {
      final messaging = FirebaseMessaging.instance;

      final notificationSettings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (notificationSettings.authorizationStatus ==
              AuthorizationStatus.authorized ||
          notificationSettings.authorizationStatus ==
              AuthorizationStatus.provisional) {
        await messaging.subscribeToTopic('garage_door_alerts');
        print('Subscribed to garage_door_alerts topic');
      }

      this.messageSubscription =
          FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('Foreground message received: ${message.notification?.title} - ${message.notification?.body}');
      });
    } catch (error) {
      print('Firebase Messaging initialization error: $error');
    }
  }

  @override
  void dispose() {
    authSubscription?.cancel();
    connectivitySubscription?.cancel();
    messageSubscription?.cancel();
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

  Future<void> restart() async {
    try {
      await this.sendMessage(
        'Restart',
        '${DateTime.now().millisecondsSinceEpoch}',
      );
    } catch (e) {
      print("Failed to write");
      print(e);
      // fallback if firebase is down
      await http.post(Uri.http(ip, '/restart'));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: new Row(
        children: [
          new Expanded(child: TrueImageCrossFade(imageStream: this.stream!)),
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
