# 🗄️ Database Migrations

## 📋 Ordem de Execução

Execute os scripts SQL nesta ordem no Supabase SQL Editor:

1. **001_schema_core.sql** - Empresas, CNPJs, Usuários
2. **002_contratos_itens.sql** - Contratos e Itens
3. **003_schema_operacional.sql** - AFs, Entregas, Custos
4. **004_auditoria_reajustes.sql** - Auditoria e Reajustes
5. **005_rls_policies.sql** - Row Level Security
6. **006_complementar.sql** - Triggers de auditoria e melhorias

## ✅ Verificação

Após executar todas as migrations, rode:
```sql
SELECT * FROM system_health_check();
```

Deve retornar:
- RLS Enabled: OK
- Audit Triggers: OK
- Performance Indexes: OK
- RLS Functions: OK

## 🔒 Segurança

### RLS Policies Implementadas:
- ✅ Isolamento multi-tenant (empresa_id)
- ✅ Soft delete filtering
- ✅ Permissões por perfil
- ✅ Proteção contra falsificação de empresa_id

### Triggers de Auditoria:
- ✅ Todas as operações (INSERT, UPDATE, DELETE)
- ✅ Captura de dados anteriores e novos
- ✅ Rastreamento de usuário, IP, user agent

## 🧪 Seeds de Teste

Para popular com dados de teste, execute:
```sql
\i seeds/test_data.sql
```
