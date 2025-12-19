import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import '../providers/entity_provider.dart';
import '../providers/review_provider.dart';
import '../widgets/review_card.dart';

class EntityDetailScreen extends StatefulWidget {
  final int entityId;

  const EntityDetailScreen({super.key, required this.entityId});

  @override
  State<EntityDetailScreen> createState() => _EntityDetailScreenState();
}

class _EntityDetailScreenState extends State<EntityDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<EntityProvider>(context, listen: false)
          .fetchEntity(widget.entityId);
      Provider.of<ReviewProvider>(context, listen: false)
          .fetchEntityReviews(widget.entityId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<EntityProvider>(
        builder: (context, entityProvider, child) {
          if (entityProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final entity = entityProvider.selectedEntity;
          if (entity == null) {
            return const Center(child: Text('Entity not found'));
          }

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 200,
                pinned: true,
                backgroundColor: Colors.deepPurple,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    entity.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          offset: Offset(0, 1),
                          blurRadius: 3.0,
                          color: Color.fromARGB(255, 0, 0, 0),
                        ),
                      ],
                    ),
                  ),
                  background: entity.avatar != null
                      ? CachedNetworkImage(
                          imageUrl: entity.avatar!,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: Colors.grey[300],
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: Colors.grey[300],
                            child: const Icon(Icons.image, size: 50),
                          ),
                        )
                      : Container(
                          color: Colors.grey[300],
                          child: const Icon(Icons.business, size: 50),
                        ),
                ),
              ),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (entity.averageRating != null) ...[
                            Row(
                              children: [
                                RatingBarIndicator(
                                  rating: entity.averageRating!,
                                  itemBuilder: (context, index) => const Icon(
                                    Icons.star,
                                    color: Colors.amber,
                                  ),
                                  itemCount: 5,
                                  itemSize: 24.0,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  entity.averageRating!.toStringAsFixed(1),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '(${entity.reviewCount ?? 0} reviews)',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (entity.description != null) ...[
                            Text(
                              'About',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              entity.description!,
                              style: TextStyle(
                                color: Colors.grey[700],
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (entity.categoryName != null) ...[
                            Chip(
                              label: Text(entity.categoryName!),
                              backgroundColor: Colors.deepPurple.shade50,
                            ),
                            const SizedBox(height: 16),
                          ],
                          const Divider(),
                          const SizedBox(height: 8),
                          Text(
                            'Reviews',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                    Consumer<ReviewProvider>(
                      builder: (context, reviewProvider, child) {
                        if (reviewProvider.isLoading) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32.0),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        if (reviewProvider.entityReviews.isEmpty) {
                          return Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Center(
                              child: Column(
                                children: [
                                  Icon(Icons.rate_review,
                                      size: 50, color: Colors.grey[400]),
                                  const SizedBox(height: 8),
                                  Text(
                                    'No reviews yet',
                                    style: TextStyle(color: Colors.grey[600]),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }

                        return Column(
                          children: reviewProvider.entityReviews
                              .map((review) => ReviewCard(review: review))
                              .toList(),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
