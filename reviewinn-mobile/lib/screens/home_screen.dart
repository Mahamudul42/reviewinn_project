import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/entity_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/entity_card.dart';
import 'entity_detail_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
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
      appBar: AppBar(
        title: Text(
          'ReviewInn',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              if (authProvider.isAuthenticated) {
                return PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'logout') {
                      authProvider.logout();
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'profile',
                      child: Row(
                        children: [
                          Icon(Icons.person),
                          const SizedBox(width: 8),
                          Text(authProvider.user?.username ?? 'Profile'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'logout',
                      child: Row(
                        children: [
                          Icon(Icons.logout),
                          SizedBox(width: 8),
                          Text('Logout'),
                        ],
                      ),
                    ),
                  ],
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: CircleAvatar(
                      backgroundColor: Colors.white,
                      child: Text(
                        authProvider.user?.username[0].toUpperCase() ?? 'U',
                        style: TextStyle(color: Colors.deepPurple),
                      ),
                    ),
                  ),
                );
              } else {
                return IconButton(
                  icon: Icon(Icons.login),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LoginScreen(),
                      ),
                    );
                  },
                );
              }
            },
          ),
        ],
      ),
      body: Consumer<EntityProvider>(
        builder: (context, entityProvider, child) {
          if (entityProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (entityProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 60, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading entities',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(entityProvider.error!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      entityProvider.fetchEntities();
                    },
                    child: Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (entityProvider.entities.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 60, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    'No entities found',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text('Check your backend connection'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => entityProvider.fetchEntities(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: entityProvider.entities.length,
              itemBuilder: (context, index) {
                final entity = entityProvider.entities[index];
                return EntityCard(
                  entity: entity,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => EntityDetailScreen(
                          entityId: entity.entityId,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Provider.of<EntityProvider>(context, listen: false).fetchEntities();
        },
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        icon: Icon(Icons.refresh),
        label: Text('Refresh'),
      ),
    );
  }
}
