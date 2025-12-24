import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Lock, Users } from 'lucide-react';
import type { FormSettings, UserAccessType } from '@/types/formBuilder';

interface FormBuilderSettingsProps {
  settings: FormSettings;
  setSettings: (settings: FormSettings) => void;
}

const userAccessOptions: { id: UserAccessType; label: string; description: string }[] = [
  { 
    id: 'unverified', 
    label: 'Onaysız Üyeler', 
    description: 'Henüz whitelist onayı almamış kullanıcılar' 
  },
  { 
    id: 'verified', 
    label: 'Onaylı Üyeler', 
    description: 'Whitelist başvurusu onaylanmış kullanıcılar' 
  },
];

export const FormBuilderSettings = ({
  settings,
  setSettings,
}: FormBuilderSettingsProps) => {
  const [newCode, setNewCode] = useState('');

  const handleUserAccessChange = (accessType: UserAccessType, checked: boolean) => {
    if (checked) {
      setSettings({
        ...settings,
        userAccessTypes: [...settings.userAccessTypes, accessType],
      });
    } else {
      setSettings({
        ...settings,
        userAccessTypes: settings.userAccessTypes.filter((r) => r !== accessType),
      });
    }
  };

  const handleAddCode = () => {
    const trimmedCode = newCode.trim();
    if (trimmedCode && !settings.accessCodes.includes(trimmedCode)) {
      setSettings({
        ...settings,
        accessCodes: [...settings.accessCodes, trimmedCode],
      });
      setNewCode('');
    }
  };

  const handleRemoveCode = (code: string) => {
    setSettings({
      ...settings,
      accessCodes: settings.accessCodes.filter((c) => c !== code),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCode();
    }
  };

  return (
    <div className="space-y-6">
      {/* User Access Restrictions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-foreground">Kullanıcı Erişimi</CardTitle>
          </div>
          <CardDescription>
            Bu formu hangi kullanıcı türleri kullanabilsin?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userAccessOptions.map((option) => (
              <div key={option.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background/50">
                <Checkbox
                  id={option.id}
                  checked={settings.userAccessTypes.includes(option.id)}
                  onCheckedChange={(checked) =>
                    handleUserAccessChange(option.id, checked as boolean)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={option.id}
                    className="text-foreground cursor-pointer font-medium"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Hiçbir tür seçilmezse form kimseye görünmez
          </p>
        </CardContent>
      </Card>

      {/* Password Protection */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <CardTitle className="text-foreground">Şifre Koruması</CardTitle>
          </div>
          <CardDescription>
            Form için erişim kodları belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
            <div className="space-y-0.5">
              <Label htmlFor="password-protection" className="text-foreground font-medium">
                Şifre Korumasını Aktifleştir
              </Label>
              <p className="text-xs text-muted-foreground">
                Sadece geçerli kodu bilenler formu görebilir
              </p>
            </div>
            <Switch
              id="password-protection"
              checked={settings.isPasswordProtected}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, isPasswordProtected: checked })
              }
            />
          </div>

          {settings.isPasswordProtected && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Erişim kodu girin..."
                  className="bg-background border-border"
                />
                <Button 
                  onClick={handleAddCode} 
                  disabled={!newCode.trim()}
                  size="icon"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {settings.accessCodes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {settings.accessCodes.map((code) => (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-3 py-1"
                    >
                      <span className="font-mono">{code}</span>
                      <button
                        onClick={() => handleRemoveCode(code)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Henüz erişim kodu eklenmemiş
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discord Webhook */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Discord Entegrasyonu</CardTitle>
          <CardDescription>
            Form doldurulduğunda Discord kanalına bildirim gönderin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="webhook" className="text-foreground">
              Discord Webhook URL
            </Label>
            <Input
              id="webhook"
              type="url"
              value={settings.discordWebhookUrl}
              onChange={(e) =>
                setSettings({ ...settings, discordWebhookUrl: e.target.value })
              }
              placeholder="https://discord.com/api/webhooks/..."
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              Webhook URL'nizi Discord sunucu ayarlarından alabilirsiniz
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cooldown & Limits */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Limitler</CardTitle>
          <CardDescription>
            Başvuru sınırlamalarını ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cooldown */}
          <div className="space-y-2">
            <Label htmlFor="cooldown" className="text-foreground">
              Bekleme Süresi (Saat)
            </Label>
            <Input
              id="cooldown"
              type="number"
              min="0"
              value={settings.cooldownHours || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cooldownHours: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
              className="bg-background border-border max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Başvurusu reddedilen kullanıcı kaç saat sonra tekrar başvurabilir (0 = sınırsız)
            </p>
          </div>

          {/* Max Applications */}
          <div className="space-y-2">
            <Label htmlFor="maxApps" className="text-foreground">
              Maksimum Başvuru Sayısı
            </Label>
            <Input
              id="maxApps"
              type="number"
              min="0"
              value={settings.maxApplications || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxApplications: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
              className="bg-background border-border max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Bu forma toplam kaç kişi başvurabilir (0 = sınırsız)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
