import 'package:flutter/material.dart';
import '../widgets/sync_indicator.dart';
import 'dashboard_screen.dart';
import 'products_screen.dart';
import 'invoice_screen.dart';
import 'customers_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final _screens = [
    const DashboardScreen(),
    const ProductsScreen(),
    const InvoiceScreen(),
    const CustomersScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('المتجر الزراعي',
              style: TextStyle(fontWeight: FontWeight.bold)),
          actions: const [
            SyncIndicatorWidget(),
            SizedBox(width: 8),
          ],
        ),
        body: _screens[_currentIndex],
        bottomNavigationBar: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (i) => setState(() => _currentIndex = i),
          destinations: const [
            NavigationDestination(
                icon: Icon(Icons.dashboard_outlined),
                selectedIcon: Icon(Icons.dashboard),
                label: 'الرئيسية'),
            NavigationDestination(
                icon: Icon(Icons.inventory_2_outlined),
                selectedIcon: Icon(Icons.inventory_2),
                label: 'المنتجات'),
            NavigationDestination(
                icon: Icon(Icons.point_of_sale_outlined),
                selectedIcon: Icon(Icons.point_of_sale),
                label: 'فاتورة'),
            NavigationDestination(
                icon: Icon(Icons.people_outline),
                selectedIcon: Icon(Icons.people),
                label: 'العملاء'),
            NavigationDestination(
                icon: Icon(Icons.settings_outlined),
                selectedIcon: Icon(Icons.settings),
                label: 'الإعدادات'),
          ],
        ),
        floatingActionButton: _currentIndex == 2
            ? FloatingActionButton.extended(
                onPressed: () {
                  // New invoice - handled in InvoiceScreen
                },
                icon: const Icon(Icons.add),
                label: const Text('فاتورة جديدة'),
              )
            : null,
      ),
    );
  }
}
