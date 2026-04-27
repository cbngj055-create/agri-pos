import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, BarChart3, Leaf, Zap, Smartphone, CheckCircle2, Factory, Stethoscope, Briefcase, LayoutDashboard, Download } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount >= 5) {
      setClickCount(0);
      navigate('/admin');
    }
    
    let timer: NodeJS.Timeout;
    if (clickCount > 0) {
      timer = setTimeout(() => {
        setClickCount(0);
      }, 2000); // Reset click count after 2 seconds
    }
    
    return () => clearTimeout(timer);
  }, [clickCount, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 font-readex selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-lg border-2 border-emerald-100">
              🌱
            </div>
            <div>
              <h1 
                className="text-xl font-bold text-slate-900 tracking-tight cursor-pointer select-none"
                onClick={() => setClickCount(prev => prev + 1)}
              >
                نظام إدارة المحاصيل
              </h1>
              <p className="text-xs text-slate-500">للمتاجر والشركات الزراعية</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
              تسجيل الدخول
            </Link>
            <Link to="/register" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition shadow-sm hover:shadow active:scale-95">
              ابدأ الآن مجاناً
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-6 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            الإصدار الحديث ٢٠٢٤ متاح الآن
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-8">
            النظام السحابي الأول لإدارة <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-400">المتاجر والشركات الزراعية</span>
          </h2>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            منصة متكاملة مصممة خصيصاً لتجار المبيدات والأسمدة والتقاوي. نساعدك في إدارة المبيعات، المشتريات، المخزون، الحسابات، وصرف الروشتات الزراعية بكل سهولة وأمان.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg hover:shadow-emerald-500/30 text-lg flex justify-center items-center gap-2">
              <Zap className="w-6 h-6" />
              قم بإنشاء حساب لمتجرك
            </Link>
            <a href="/agri-pos.apk" download className="bg-white text-slate-700 px-8 py-4 rounded-xl font-bold border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition shadow-sm text-lg flex justify-center items-center gap-2">
              <Download className="w-6 h-6" />
              تحميل تطبيق الموبايل
            </a>
            <Link to="/login" className="bg-white text-slate-700 px-8 py-4 rounded-xl font-bold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition shadow-sm text-lg text-center flex justify-center items-center">
              هل لديك متجر بالفعل؟
            </Link>
          </div>
        </div>
        
        {/* Mockup Image */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl -z-10 rounded-full h-full transform scale-110"></div>
          <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl shadow-2xl p-2 sm:p-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center aspect-[16/9] md:aspect-[21/9]">
                <div className="text-center p-6">
                    <p className="text-emerald-800 text-xl font-medium flex items-center justify-center gap-2">
                       <LayoutDashboard className="w-8 h-8"/> 
                       واجهة تحكم متطورة وسهلة الاستخدام
                    </p>
                    <p className="mt-2 text-slate-500">تم تصميمها خصيصاً لتناسب سرعتك في المتجر</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">كل ما يحتاجه متجرك الزراعي في مكان واحد</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">تخلص من الدفاتر الورقية والأنظمة المعقدة غير المخصصة للمجال الزراعي واعتمد على حلولنا المتخصصة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Factory />}
              title="إدارة المخزون والباركود"
              description="تسجيل الأصناف (أسمدة، مبيدات، بذور) ودعم كامل للباركود وتواريخ الصلاحية مع تنبيهات نقص المخزون."
            />
            <FeatureCard 
              icon={<Stethoscope />}
              title="روشتات زراعية"
              description="إصدار وحفظ روشتات وتوصيات المحاصيل بناءً على التشخيص وتوجيه صرف الأدوية للعملاء."
            />
            <FeatureCard 
              icon={<ShieldCheck />}
              title="حسابات الموردين والعملاء"
              description="نظام كامل للديون والآجل والمقدم، مع تتبع حركة الدفعات والشيكات بدقة."
            />
            <FeatureCard 
              icon={<BarChart3 />}
              title="تقارير دقيقة"
              description="تقارير مبيعات وأرباح مفصلة وحسابات ختامية وتقييم للمخزون بضغطة زر."
            />
            <FeatureCard 
              icon={<Briefcase />}
              title="شؤون الموظفين والمصروفات"
              description="إدراة رواتب الموظفين والسلف والخصومات مع تتبع المصروفات النثرية اليومية للمتجر."
            />
            <FeatureCard 
              icon={<Smartphone />}
              title="سحابي ويعمل في أي وقت"
              description="الوصول إلى بياناتك من أي جهاز (جوال، تابلت، كمبيوتر) مع نسخ احتياطي تلقائي للبيانات."
            />
          </div>
        </div>
      </section>

      {/* About Us / Why Choose Us */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-emerald-900 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="p-12 md:p-16 lg:p-20 relative z-10 flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1 text-white">
                      <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-white leading-snug">
                          نضع التكنولوجيا في خدمة مستقبلك الزراعي
                      </h3>
                      <p className="text-emerald-100 text-lg mb-8 leading-relaxed">
                          نحن فريق من المتخصصين في البرمجيات نفهم تعقيدات الأعمال الزراعية اليومية. قمنا بتطوير النظام ليكون "موظف الحسابات الذكي" الخاص بك، لا يخطئ، ولا ينسى، ومتاح ٢٤ ساعة.
                      </p>
                      <ul className="space-y-4">
                          <li className="flex items-center gap-3 text-emerald-50">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              <span>دعم فني متواصل وحل فوري لأي مشاكل</span>
                          </li>
                          <li className="flex items-center gap-3 text-emerald-50">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              <span>تحديثات مستمرة تواكب متطلبات السوق الزراعي</span>
                          </li>
                          <li className="flex items-center gap-3 text-emerald-50">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              <span>أمان تام لبياناتك وحماية الخصوصية</span>
                          </li>
                      </ul>
                  </div>
                  <div className="w-full md:w-1/3">
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 rounded-2xl flex flex-col items-center text-center">
                         <Leaf className="w-20 h-20 text-emerald-400 mb-6" />
                         <div className="text-5xl font-bold text-white mb-2">+٥٠٠</div>
                         <div className="text-emerald-100">متجر وشركة يعتمدون علينا</div>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-sm shadow border border-emerald-100">
              🌱
            </div>
            <span className="text-lg font-bold text-slate-800">نظام المتجر الزراعي</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-600 transition">الشروط والأحكام</a>
            <a href="#" className="hover:text-emerald-600 transition">سياسة الخصوصية</a>
            <a href="#" className="hover:text-emerald-600 transition">تواصل معنا</a>
          </div>
          <div>
            &copy; {new Date().getFullYear()} كافة الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition duration-300">
      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
        {icon}
      </div>
      <h4 className="text-xl font-bold text-slate-800 mb-3">{title}</h4>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
