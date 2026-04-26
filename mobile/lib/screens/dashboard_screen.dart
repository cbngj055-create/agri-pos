import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic> _stats = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final provider = context.read<AppProvider>();
    final stats = await provider.getDashboardStats();
    if (mounted) {
      setState(() {
        _stats = stats;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final todaySales = _stats['todaySales'] ?? 0;
    final todayOrders = _stats['todayOrders'] ?? 0;
    final totalProducts = _stats['totalProducts'] ?? 0;
    final lowStock = _stats['lowStock'] ?? 0;
    final totalCustomers = _stats['totalCustomers'] ?? 0;
    final totalDebt = _stats['totalDebt'] ?? 0;

    return RefreshIndicator(
      onRefresh: () async => _loadStats(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('لوحة التحكم', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: [
              _StatCard(
                title: 'مبيعات اليوم',
                value: '${_formatNumber(todaySales)} ج.م',
                icon: Icons.trending_up,
                color: Colors.green,
              ),
              _StatCard(
                title: 'طلبات اليوم',
                value: '$todayOrders',
                icon: Icons.receipt_long,
                color: Colors.blue,
              ),
              _StatCard(
                title: 'إجمالي المنتجات',
                value: '$totalProducts',
                icon: Icons.inventory_2,
                color: Colors.purple,
              ),
              _StatCard(
                title: 'مخزون منخفض',
                value: '$lowStock',
                icon: Icons.warning_amber,
                color: Colors.orange,
              ),
              _StatCard(
                title: 'إجمالي العملاء',
                value: '$totalCustomers',
                icon: Icons.people,
                color: Colors.teal,
              ),
              _StatCard(
                title: 'إجمالي الديون',
                value: '${_formatNumber(totalDebt)} ج.م',
                icon: Icons.account_balance_wallet,
                color: Colors.red,
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text('إجراءات سريعة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () {
                    // Navigate to invoice tab
                  },
                  icon: const Icon(Icons.point_of_sale),
                  label: const Text('فاتورة جديدة'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // Navigate to products tab
                  },
                  icon: const Icon(Icons.add_shopping_cart),
                  label: const Text('إضافة منتج'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatNumber(dynamic n) {
    final num val = n is num ? n : 0;
    return val.toStringAsFixed(val.truncateToDouble() == val ? 0 : 2);
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const Spacer(),
            Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }
}
