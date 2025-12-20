import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/entity_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/entity_card.dart';
import '../config/app_theme.dart';
import 'entity_detail_screen.dart';
import 'add_entity_screen.dart';
import 'login_screen.dart';

class EntitiesScreen extends StatefulWidget {
  const EntitiesScreen({super.key});

  @override
  State<EntitiesScreen> createState() => _EntitiesScreenState();
}

class _EntitiesScreenState extends State<EntitiesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<EntityProvider>(context, listen: false).fetchEntities();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          if (!authProvider.isAuthenticated) {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
            return;
          }

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const AddEntityScreen(),
            ),
          );
        },
        backgroundColor: AppTheme.accentYellow,
        foregroundColor: Colors.white,
        icon: Icon(Icons.add_business_rounded),
        label: Text(
          'Add Entity',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
        elevation: 4,
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Clean App Bar
            SliverAppBar(
              floating: true,
              snap: true,
              backgroundColor: Colors.white,
              elevation: 0,
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.accentYellow.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.business_rounded,
                      color: AppTheme.accentYellow,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Explore Entities',
                    style: AppTheme.headingMedium.copyWith(
                      fontSize: 22,
                    ),
                  ),
                ],
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(1),
                child: Container(
                  color: AppTheme.borderLight,
                  height: 1,
                ),
              ),
            ),

            // Search bar
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.spaceL,
                  AppTheme.spaceM,
                  AppTheme.spaceL,
                  AppTheme.spaceL,
                ),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search entities...',
                    prefixIcon: Icon(
                      Icons.search,
                      color: AppTheme.textTertiary,
                    ),
                    filled: true,
                    fillColor: AppTheme.backgroundLight,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spaceL,
                      vertical: AppTheme.spaceM,
                    ),
                  ),
                ),
              ),
            ),

            // Entities List
            Consumer<EntityProvider>(
              builder: (context, entityProvider, child) {
                if (entityProvider.isLoading) {
                  return const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                if (entityProvider.entities.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: AppTheme.accentYellow.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.business_rounded,
                              size: 64,
                              color: AppTheme.accentYellow.withOpacity(0.6),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'No entities found',
                            style: AppTheme.headingMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Check back later for new entities!',
                            style: AppTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppTheme.spaceL,
                    AppTheme.spaceM,
                    AppTheme.spaceL,
                    AppTheme.spaceL,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final entity = entityProvider.entities[index];
                        return EntityCard(
                          entity: entity,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    EntityDetailScreen(entityId: entity.entityId),
                              ),
                            );
                          },
                        );
                      },
                      childCount: entityProvider.entities.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
