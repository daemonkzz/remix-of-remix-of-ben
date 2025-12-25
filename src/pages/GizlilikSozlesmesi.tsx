import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const GizlilikSozlesmesi = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-6 max-w-4xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl md:text-4xl font-serif italic text-primary mb-4">
                Gizlilik Sözleşmesi
              </h1>
              <div className="w-24 h-px bg-primary/50 mx-auto" />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-invert prose-lg max-w-none"
            >
              <div className="bg-card/30 backdrop-blur-sm border border-border/20 rounded-lg p-6 md:p-10">
                <div className="text-foreground/80 space-y-8 font-light leading-relaxed text-sm md:text-base">
                  
                  {/* Intro */}
                  <p>
                    <strong className="text-primary">Kaze Community</strong> ("biz", "sunucu" veya "platform") olarak, oyuncularımızın ve site ziyaretçilerimizin gizliliğine büyük önem veriyoruz. Bu Gizlilik Politikası, web sitemiz (<code className="text-primary/80">kaze-zrp.com</code>) ve FiveM sunucumuz üzerinden hangi verilerin toplandığını, bu verilerin nasıl kullanıldığını ve nasıl korunduğunu açıklamaktadır.
                  </p>
                  <p className="text-foreground/60 italic">
                    Hizmetlerimizi kullanarak (web sitesine giriş yaparak veya sunucuya bağlanarak), bu politikada belirtilen şartları kabul etmiş sayılırsınız.
                  </p>

                  {/* Section 1 */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif italic text-primary border-b border-primary/20 pb-2">
                      1. Topladığımız Bilgiler
                    </h2>
                    <p>
                      Kullanıcı deneyimini sağlamak, oyun içi ilerlemeyi kaydetmek ve güvenlik önlemleri almak amacıyla aşağıdaki verileri topluyoruz:
                    </p>
                    
                    <div className="pl-4 border-l-2 border-primary/30 space-y-4">
                      <div>
                        <h3 className="font-medium text-foreground mb-2">A. Üçüncü Taraf Hesap Bilgileri (Discord ve Steam)</h3>
                        <p className="mb-2">Sitemize giriş yaparken ve sunucumuza bağlanırken Discord ve Steam API'lerini kullanırız. Bu entegrasyonlar aracılığıyla şu verilere erişebiliriz:</p>
                        <ul className="list-disc list-inside space-y-1 text-foreground/70">
                          <li><strong>Discord:</strong> Kullanıcı adı, Discord ID (benzersiz kimlik numarası), Avatar görseli ve sunucumuzdaki rolleriniz.</li>
                          <li><strong>Steam:</strong> Steam Hex ID, Steam Kullanıcı Adı ve Profil URL'si.</li>
                        </ul>
                        <p className="mt-2 text-foreground/60 italic text-sm">
                          Not: Şifrelerinize <strong>asla</strong> erişimimiz yoktur. Giriş işlemleri doğrudan Discord ve Steam'in güvenli sunucuları üzerinden gerçekleşir.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-foreground mb-2">B. Sunucu ve Oyun İçi Veriler</h3>
                        <p className="mb-2">FiveM sunucumuzda vakit geçirdiğiniz süre boyunca şu veriler kaydedilir:</p>
                        <ul className="list-disc list-inside space-y-1 text-foreground/70">
                          <li>IP Adresiniz (Güvenlik ve hile koruması için).</li>
                          <li>Oyun içi karakter bilgileri (Para, envanter, araçlar, mülkler vb.).</li>
                          <li>Oyun içi sohbet kayıtları ve işlem logları (Log kayıtları).</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif italic text-primary border-b border-primary/20 pb-2">
                      2. Verilerin Kullanım Amacı
                    </h2>
                    <p>Topladığımız verileri şu amaçlarla işliyoruz:</p>
                    <ol className="list-decimal list-inside space-y-2 text-foreground/70 pl-2">
                      <li><strong>Kimlik Doğrulama:</strong> Discord ve Steam hesaplarınızı eşleştirerek, doğru kişinin doğru karaktere erişmesini sağlamak.</li>
                      <li><strong>Oyun Deneyimi:</strong> Karakterinizin ilerlemesini (para, level, eşya) veritabanımızda saklamak ve bir sonraki girişinizde devam etmenizi sağlamak.</li>
                      <li><strong>Güvenlik ve Moderasyon:</strong> Hile kullanımı, kural ihlalleri veya taciz gibi durumları tespit etmek ve "Whitelist" (İzinli Giriş) sistemini yönetmek.</li>
                      <li><strong>Topluluk Yönetimi:</strong> Discord rollerinize göre web sitesinde veya oyun içinde size özel yetkiler tanımlamak (Örn: Yönetici, Polis, Doktor vb.).</li>
                    </ol>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif italic text-primary border-b border-primary/20 pb-2">
                      3. Çerezler (Cookies)
                    </h2>
                    <p>
                      Web sitemiz, oturumunuzu açık tutmak ve tercihlerinizi hatırlamak için basit çerezler (cookies) kullanabilir. Tarayıcı ayarlarınızdan çerezleri dilediğiniz zaman silebilirsiniz, ancak bu durumda otomatik giriş özelliğini kaybedebilirsiniz.
                    </p>
                  </div>

                  {/* Section 4 */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif italic text-primary border-b border-primary/20 pb-2">
                      4. Verilerin Paylaşımı
                    </h2>
                    <p>
                      Kişisel verileriniz, <strong className="text-primary">Kaze Community</strong> yönetimi dışında üçüncü şahıslara satılmaz veya kiralanmaz. Ancak aşağıdaki durumlarda veriler paylaşılabilir:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-foreground/70 pl-2">
                      <li><strong>Yasal Zorunluluklar:</strong> Yetkili makamlarca (Savcılık, Emniyet vb.) talep edilmesi durumunda, IP adresleri ve bağlantı logları yasal çerçevede paylaşılabilir.</li>
                      <li><strong>Servis Sağlayıcılar:</strong> Sunucu barındırma hizmeti aldığımız veri merkezi, verilerin fiziksel olarak saklandığı yerdir.</li>
                    </ul>
                  </div>

                  {/* Section 5 */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif italic text-primary border-b border-primary/20 pb-2">
                      5. Veri Güvenliği
                    </h2>
                    <p>
                      Verilerinizi korumak için endüstri standardı güvenlik önlemleri (SSL şifreleme, Güvenlik Duvarları, Güçlü Veritabanı Şifreleme) kullanıyoruz. Ancak, internet üzerinden yapılan hiçbir veri aktarımının %100 güvenli olduğunu garanti edemeyiz.
                    </p>
                    <p className="text-foreground/60 italic">
                      Hesabınızın güvenliği için Discord ve Steam hesaplarınızda <strong>İki Aşamalı Doğrulama (2FA)</strong> kullanmanızı şiddetle öneririz.
                    </p>
                  </div>

                  {/* Section 6 */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif italic text-primary border-b border-primary/20 pb-2">
                      6. Kullanıcı Hakları ve İletişim
                    </h2>
                    <p>
                      Kullanıcılar, kendileri hakkında tutulan verilerin silinmesini veya anonimleştirilmesini talep etme hakkına sahiptir (Oyun içi ban geçmişi gibi sunucu güvenliğini etkileyen durumlar saklı kalmak kaydıyla).
                    </p>
                    <p>Bu politika hakkında sorularınız veya veri silme talepleriniz için bize ulaşabilirsiniz:</p>
                    <div className="bg-background/50 rounded-lg p-4 space-y-2">
                      <p><strong>Discord:</strong> <a href="https://discord.gg/kazezrp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">discord.gg/kazezrp</a></p>
                      <p><strong>E-posta:</strong> <a href="mailto:daemon@kazecommunity.com" className="text-primary hover:underline">daemon@kazecommunity.com</a></p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
  );
};

export default GizlilikSozlesmesi;