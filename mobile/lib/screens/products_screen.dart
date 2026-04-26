import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<Map<String, dynamic>> _products = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    final provider = context.read<AppProvider>();
    final products = await provider.getProducts(search: _search.isNotEmpty ? _search : null);
    if (mounted) {
      setState(() {
        _products = products;
        _loading = false;
      });
    }
  }

  void _showAddProductDialog() {
    final nameController = TextEditingController();
    final barcodeController = TextEditingController();
    final buyPriceController = TextEditingController();
    final sellPriceController = TextEditingController();
    final stockController = TextEditingController(text: '0');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إضافة منتج جديد'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'اسم المنتج *')),
              const SizedBox(height: 12),
              TextField(controller: barcodeController, decoration: const InputDecoration(labelText: 'الباركود'), textDirection: TextDirection.ltr),
              const SizedBox(height: 12),
              TextField(controller: buyPriceController, decoration: const InputDecoration(labelText: 'سعر الشراء'), keyboardType: TextInputType.number),
              const SizedBox(height: 12),
              TextField(controller: sellPriceController, decoration: const InputDecoration(labelText: 'سعر البيع *'), keyboardType: TextInputType.number),
              const SizedBox(height: 12),
              TextField(controller: stockController, decoration: const InputDecoration(labelText: 'الكمية'), keyboardType: TextInputType.number),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          FilledButton(
            onPressed: () async {
              if (nameController.text.isEmpty || sellPriceController.text.isEmpty) return;
              final provider = context.read<AppProvider>();
              await provider.addProduct({
                'name': nameController.text,
                'barcode': barcodeController.text.isEmpty ? null : barcodeController.text,
                'buy_price': double.tryParse(buyPriceController.text) ?? 0,
                'sell_price': double.tryParse(sellPriceController.text) ?? 0,
                'stock': double.tryParse(stockController.text) ?? 0,
                'unit': 'piece',
              });
              if (ctx.mounted) Navigator.pop(ctx);
              _loadProducts();
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
              hintText: 'بحث بالاسم أو الباركود...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.add),
                onPressed: _showAddProductDialog,
              ),
            ),
            onChanged: (v) {
              _search = v;
              _loadProducts();
            },
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _products.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          Text('لا توجد منتجات', style: TextStyle(color: Colors.grey.shade500, fontSize: 18)),
                          const SizedBox(height: 8),
                          FilledButton.tonal(onPressed: _showAddProductDialog, child: const Text('إضافة أول منتج')),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _products.length,
                      itemBuilder: (ctx, i) {
                        final p = _products[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFF064e3b),
                              child: Text(
                                (p['name'] as String?)?.substring(0, 1) ?? '?',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                            ),
                            title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('السعر: ${p['sell_price']} ج.م | المخزون: ${p['stock']}'),
                            trailing: PopupMenuButton(
                              itemBuilder: (_) => [
                                const PopupMenuItem(value: 'edit', child: Text('تعديل')),
                                const PopupMenuItem(value: 'delete', child: Text('حذف')),
                              ],
                              onSelected: (val) async {
                                if (val == 'delete') {
                                  await context.read<AppProvider>().deleteProduct(p['id'] as String);
                                  _loadProducts();
                                }
                              },
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
