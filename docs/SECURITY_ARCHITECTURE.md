SECURITY_ARCHITECTURE.md
Project: Multi-Tenant SaaS (Supabase)
1. ARCHITECTURE OVERVIEW
This system implements strict multi-tenant isolation using:

PostgreSQL Row Level Security (RLS)

Supabase Storage policies

Tenant isolation via empresa_id

Profile-based access control

Soft delete strategy

Audit logging with triggers

2. TENANT MODEL
Each record is linked to:

empresa_id UUID

Isolation rule: All queries are filtered by:

empresa_id = get_user_empresa_id()

The function get_user_empresa_id() retrieves the empresa_id of the authenticated user.

3. RLS STRATEGY
Core Principles
RLS enabled on all critical tables

SELECT / INSERT / UPDATE / DELETE separated when needed

WITH CHECK enforced on INSERT and UPDATE

No hard delete in business tables

empresa_id cannot be changed via UPDATE

Protected Tables
empresas

cnpjs

usuarios

contratos

itens_contrato

custos_item

autorizacoes_fornecimento

entregas

reajustes

auditoria

4. PROFILE CONTROL
Access controlled via:

get_user_perfil()

Example restriction:

logística cannot view custos_item

delete allowed only for admin where applicable

5. STORAGE SECURITY MODEL
All buckets follow strict policy pattern:

bucket_id = '<bucket-name>' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = get_user_empresa_id()::text

Buckets Protected (Identificadores Exatos)
contratos

reajustes

notas-fiscais-entrada

notas-fiscais-saida

autorizacoes-fornecimento

6. STORAGE STRUCTURE (MANDATORY)
Files must be stored as:

<bucket>/<empresa_id>/<filename>

Example:

notas-fiscais-saida/550e8400-e29b-41d4-a716-446655440000/nota_001.pdf

Nota Crítica: Se o empresa_id não for a primeira pasta do caminho (root folder dentro do bucket), o acesso será negado por RLS.

7. SOFT DELETE STRATEGY
Tables use:

deleted_at TIMESTAMPTZ

Hard DELETE is blocked by absence of policy in sensitive tables.

8. AUDIT
Triggers log INSERT / UPDATE / DELETE into auditoria table.

Audit is protected by RLS per empresa_id.

9. COMPANY STATUS CONTROL
empresa_esta_ativa() ensures suspended companies cannot access protected data.

10. SECURITY GUARANTEES
Tenant data isolation

No cross-company storage access

No empresa_id manipulation

Profile-based restrictions

Authenticated access required

RLS enforced database-wide

11. OPEN FOR REVIEW
Requested validation points:

Potential RLS bypass vectors

Storage path traversal risks

Policy OR/AND conflicts

Service role misuse scenarios

Edge cases involving auth role changes

Performance impact of RLS functions

End of document.