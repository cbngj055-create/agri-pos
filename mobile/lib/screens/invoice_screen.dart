import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../db/app_database.dart';

class InvoiceScreen extends StatefulWidget {
  const InvoiceScreen({super.key});

  @override
  State<InvoiceScreen> createState() => _InvoiceScreenState();
}

class _InvoiceScreenState extends State<InvoiceScreen> {
  final List<Map<String, dynamic>> _cart = [];
  final _customerNameController = TextEditingController();
  final _discountController = TextEditingController(text: '0');
  List<Map<String, dynamic>> _productSearch = [];
  bool _searching = false;

  double get _subtotal => _cart.fold(0.0, (sum, item) => sum + (item['total'] as num).toDouble());
  double get _discount => double.tryParse(_discountController.text) ?? 0;
  double get _total => _subtotal - _discount;

  Future<void> _searchProducts(String query) async {
    if (query.isEmpty) {
      setState(() => _productSearch = []);
      return;
    }
    setState(() => _searching = true);
    final provider = context.read<AppProvider>();
    final results = await provider.getProducts(search: query);
    if (mounted) {
      setState(() {
        _productSearch = results;
        _searching = false;
      });
    }
  }

  void _addToCart(Map<String, dynamic> product) {
    final existingIndex = _cart.indexWhere((item) => item['product_id'] == product['id']);
    setState(() {
      if (existingIndex >= 0) {
        final existing = _cart[existingIndex];
        final newQty = (existing['quantity'] as num).toDouble() + 1;
        final price = (product['sell_price'] as num).toDouble();
        _cart[existingIndex] = {
          ...existing,
          'quantity': newQty,
          'total': newQty * price,
        };
      } else {
        final price = (product['sell_price'] as num).toDouble();
        _cart.add({
          'product_id': product['id'],
          'product_name': product['name'],
          'price': price,
          'quantity': 1.0,
          'total': price,
        });
      }
      _productSearch = [];
    });
  }

  void _removeFromCart(int index) {
    setState(() => _cart.removeAt(index));
  }

  Future<void> _completeSale() async {
    if (_cart.isEmpty) return;

    final provider = context.read<AppProvider>();
    final orderId = await provider.addOrder({
      'type': 'sale',
      'total': _total,
      'discount': _discount,
      'paid': _total,
      'status': 'completed',
      'notes': _customerNameController.text.isNotEmpty ? 'عميل: ${_customerNameController.text}' : null,
    });

    for (final item in _cart) {
      await provider.addOrderItem({
        'order_id': orderId,
        'product_id': item['product_id'],
        'quantity': item['quantity'],
        'price': item['price'],
        'total': item['total'],
      });
    }

    setState(() {
      _cart.clear();
      _customerNameController.clear();
      _discountController.text = '0';
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم إتمام عملية البيع بنجاح ✅'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Product search
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              TextField(
                decoration: const InputDecoration(
                  hintText: 'ابحث بالاسم أو الباركود...',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: _searchProducts,
              ),
              if (_searching) const LinearProgressIndicator(),
              if (_productSearch.isNotEmpty)
                Container(
                  constraints: const BoxConstraints(maxHeight: 200),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _productSearch.length,
                    itemBuilder: (ctx, i) {
                      final p = _productSearch[i];
                      return ListTile(
                        dense: true,
                        title: Text(p['name'] ?? ''),
                        subtitle: Text('${p['sell_price']} ج.م | مخزون: ${p['stock']}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.add_circle, color: Color(0xFF064e3b)),
                          onPressed: () => _addToCart(p),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),

        // Cart items
        Expanded(
          child: _cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text('الفاتورة فارغة', style: TextStyle(color: Colors.grey.shade500, fontSize: 18)),
                      const SizedBox(height: 8),
                      const Text('ابحث عن منتج وأضفه للفاتورة', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: _cart.length,
                  itemBuilder: (ctx, i) {
                    final item = _cart[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        title: Text(item['product_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('الكمية: ${item['quantity']} × ${item['price']} ج.م'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('${item['total']} ج.م', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _removeFromCart(i),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),

        // Total & Complete
        if (_cart.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('المجموع:', style: TextStyle(fontSize: 16)),
                    Text('${_subtotal.toStringAsFixed(2)} ج.م', style: const TextStyle(fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text('خصم:'),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 100,
                      child: TextField(
                        controller: _discountController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(suffixText: 'ج.م', isDense: true),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                  ],
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('الإجمالي:', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    Text('${_total.toStringAsFixed(2)} ج.م', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF064e3b))),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: FilledButton.icon(
                    onPressed: _completeSale,
                    icon: const Icon(Icons.check_circle),
                    label: const Text('إتمام عملية البيع', style: TextStyle(fontSize: 18)),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
