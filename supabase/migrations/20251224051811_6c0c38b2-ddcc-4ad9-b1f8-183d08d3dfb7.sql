-- Generate TOTP secret for daemonkz and set as provisioned
UPDATE public.admin_2fa_settings 
SET 
  totp_secret = 'JBSWY3DPEHPK3PXP2RDFMJSW4YLNKQZX',
  is_provisioned = true,
  updated_at = now()
WHERE user_id = '4760c02a-30a7-4677-9474-812f36ad77d6';