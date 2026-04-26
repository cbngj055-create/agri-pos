import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  List<Map<String, dynamic>> _customers = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    final provider = context.read<AppProvider>();
    final customers = await provider.getCustomers(search: _search.isNotEmpty ? _search : null);
    if (mounted) {
      setState(() {
        _customers = customers;
        _loading = false;
      });
    }
  }

  void _showAddCustomerDialog() {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final addressController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إضافة عميل جديد'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'اسم العميل *')),
            const SizedBox(height: 12),
            TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'رقم الهاتف'), keyboardType: TextInputType.phone, textDirection: TextDirection.ltr),
            const SizedBox(height: 12),
            TextField(controller: addressController, decoration: const InputDecoration(labelText: 'العنوان')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          FilledButton(
            onPressed: () async {
              if (nameController.text.isEmpty) return;
              final provider = context.read<AppProvider>();
              await provider.addCustomer({
                'name': nameController.text,
                'phone': phoneController.text.isEmpty ? null : phoneController.text,
                'address': addressController.text.isEmpty ? null : addressController.text,
                'balance': 0,
              });
              if (ctx.mounted) Navigator.pop(ctx);
              _loadCustomers();
            },
            child: const Text('إضافة'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'بحث بالاسم أو الهاتف...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.person_add),
                onPressed: _showAddCustomerDialog,
              ),
            ),
            onChanged: (v) {
              _search = v;
              _loadCustomers();
            },
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _customers.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.people_outline, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          Text('لا يوجد عملاء', style: TextStyle(color: Colors.grey.shade500, fontSize: 18)),
                          const SizedBox(height: 8),
                          FilledButton.tonal(onPressed: _showAddCustomerDialog, child: const Text('إضافة أول عميل')),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _customers.length,
                      itemBuilder: (ctx, i) {
                        final c = _customers[i];
                        final balance = (c['balance'] as num?)?.toDouble() ?? 0;
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: balance > 0 ? Colors.red.shade50 : const Color(0xFF064e3b),
                              child: Text(
                                (c['name'] as String?)?.substring(0, 1) ?? '?',
                                style: TextStyle(
                                  color: balance > 0 ? Colors.red : Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            title: Text(c['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(c['phone'] ?? 'بدون رقم'),
                            trailing: balance > 0
                                ? Text('${balance.toStringAsFixed(2)} ج.م', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold))
                                : const Icon(Icons.check_circle, color: Colors.green),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
