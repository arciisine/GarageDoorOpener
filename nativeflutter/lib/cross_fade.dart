import 'package:flutter/material.dart';

class TrueImageCrossFade extends StatefulWidget {
  final Stream<Image> imageStream;

  const TrueImageCrossFade({super.key, required this.imageStream});

  @override
  State<TrueImageCrossFade> createState() => _TrueImageCrossFadeState();
}

class _TrueImageCrossFadeState extends State<TrueImageCrossFade>
    with SingleTickerProviderStateMixin {
  Image? _previousImage;
  Image? _currentImage;
  late AnimationController _controller;
  late Animation<double> _fadeInAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeInAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleNewImage(Image newImage) {
    if (_currentImage?.hashCode != newImage.hashCode) {
      _previousImage = _currentImage;
      _currentImage = newImage;
      _controller.reset();
      _controller.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Image>(
      stream: widget.imageStream,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          _handleNewImage(snapshot.data!);
        }

        if (_currentImage == null) {
          return const SizedBox.shrink();
        }

        return Stack(
          children: [
            // BOTTOM LAYER: The old image stays at 100% opacity
            if (_previousImage != null) SizedBox.expand(child: _previousImage),

            // TOP LAYER: The new image fades in on top
            SizedBox.expand(
              child: FadeTransition(
                opacity: _fadeInAnimation,
                child: _currentImage,
              ),
            ),
          ],
        );
      },
    );
  }
}
