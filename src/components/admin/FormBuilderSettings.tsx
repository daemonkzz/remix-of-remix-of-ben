import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { FormSettings } from '@/types/formBuilder';

interface FormBuilderSettingsProps {
  settings: FormSettings;
  setSettings: (settings: FormSettings) => void;
}

const roleOptions = [
  { id: 'admin', label: 'Admin' },
  { id: 'moderator', label: 'Moderatör' },
  { id: 'user', label: 'Kullanıcı (Onaylı)' },
];

export const FormBuilderSettings = ({
  settings,
  setSettings,
}: FormBuilderSettingsProps) => {
  const handleRoleChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setSettings({
        ...settings,
        roleRestrictions: [...settings.roleRestrictions, roleId],
      });
    } else {
      setSettings({
        ...settings,
        roleRestrictions: settings.roleRestrictions.filter((r) => r !== roleId),
      });
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Role Restrictions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Rol Kısıtlaması</CardTitle>
          <CardDescription>
            Bu formu hangi rollere sahip kullanıcılar görebilir?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roleOptions.map((role) => (
              <div key={role.id} className="flex items-center gap-3">
                <Checkbox
                  id={role.id}
                  checked={settings.roleRestrictions.includes(role.id)}
                  onCheckedChange={(checked) =>
                    handleRoleChange(role.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={role.id}
                  className="text-foreground cursor-pointer"
                >
                  {role.label}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Hiçbir rol seçilmezse form herkese açık olur
          </p>
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
