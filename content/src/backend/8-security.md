# Backend Engineer — Security

## OWASP Top 10 for backend engineers
- id: be-sec-01
- round: SECURITY
- difficulty: medium
- levels:
- tags: OWASP, web security, vulnerabilities, secure coding

### Prompt
What is the OWASP Top 10? Pick the most relevant risks for a backend engineer and explain how you'd prevent each in a typical API.

### Answer
#### What the interviewer is really testing
- Familiarity with **common vulnerability classes** and real attack examples.
- **Concrete defences** in backend code, not just names.
- **Defence in depth** and secure defaults.
- How security fits into the **development process** (reviews, scanning, threat modelling).

#### Key points
- OWASP Top 10 is a widely used list of the most critical **web application security risks**, updated every few years.
- Key categories (2021 list): **Broken Access Control**, **Cryptographic Failures**, **Injection**, **Insecure Design**, **Security Misconfiguration**, **Vulnerable and Outdated Components**, **Identification and Authentication Failures**, **Software and Data Integrity Failures**, **Security Logging and Monitoring Failures**, **Server-Side Request Forgery (SSRF)**.
- Broken access control (e.g. **IDOR**) is the most common: always check authorisation per object on the server.
- Injection: **parameterised queries**, avoid shelling out with user input.
- SSRF: validate and restrict outbound URLs; block internal metadata endpoints.
- Process: threat modelling, code review checklists, SAST/DAST, dependency scanning, security logging.

#### Model answer
"The OWASP Top 10 is a consensus list of the most critical web application security risks. I'll go through the ones I see most in backend APIs and how I prevent them.

**1. Broken access control (most common).**
- Example: **IDOR** (insecure direct object reference): `GET /api/invoices/1043` returns any invoice if the user changes the ID, because the code checks authentication but not ownership.
- Prevention:
  - **Check authorisation on every request, server-side, per object**: `SELECT * FROM invoices WHERE id = :id AND tenant_id = :current_tenant`.
  - Deny by default; centralise policy checks (middleware/policy library) rather than ad-hoc checks.
  - Tests for access control (user A can't access user B's resources).
  - Avoid relying on unguessable IDs as the only protection (UUIDs help but aren't authorisation).

**2. Injection (SQL, NoSQL, command, LDAP).**
- Example: `f"SELECT * FROM users WHERE email = '{email}'"` with `email = "' OR '1'='1"`.
- Prevention: **parameterised queries**/ORM bindings; never build queries or shell commands by string concatenation; validate input types; least-privilege DB users.

**3. Cryptographic failures.**
- Sensitive data in plaintext, weak hashing (MD5/SHA1 for passwords), no TLS.
- Prevention: **TLS everywhere**; passwords hashed with **bcrypt/scrypt/Argon2**; encryption at rest; never roll your own crypto; manage keys in a KMS.

**4. Identification and authentication failures.**
- Credential stuffing, weak session handling, no rate limiting on login, JWTs that never expire.
- Prevention: MFA, rate limiting and lockout/CAPTCHA on login, secure session cookies (HttpOnly, Secure, SameSite), short-lived tokens with refresh rotation, use proven identity providers.

**5. Security misconfiguration.**
- Debug mode in production, default credentials, verbose error messages with stack traces, open S3 buckets, permissive CORS (`*` with credentials).
- Prevention: hardened configuration as code, secure defaults, automated config scanning, generic error responses to clients (details in logs).

**6. Vulnerable and outdated components.**
- Example: Log4Shell (Log4j) allowed remote code execution through log messages.
- Prevention: dependency scanning (Dependabot, Snyk), SBOMs, regular updates, minimal base images, a process for urgent patching.

**7. Server-Side Request Forgery (SSRF).**
- Example: a 'fetch image from URL' feature lets attackers request `http://169.254.169.254/` (cloud metadata) to steal credentials, or internal services.
- Prevention: allow-list domains/schemes, resolve and block private/internal IP ranges (and re-check after redirects/DNS rebinding), use IMDSv2 on AWS, route outbound fetches through an egress proxy.

**8. Insecure design.**
- Missing security controls by design, e.g. password reset tokens that don't expire, no rate limits on expensive operations, business logic abuse (applying a discount coupon repeatedly).
- Prevention: **threat modelling** during design (STRIDE), abuse cases alongside user stories.

**9. Software and data integrity failures.**
- Unsigned updates, insecure deserialisation, compromised CI pipelines.
- Prevention: signed artifacts, protected CI, avoid deserialising untrusted data with unsafe formats (Python pickle, Java native serialisation).

**10. Security logging and monitoring failures.**
- Breaches go unnoticed for months.
- Prevention: log authentication events, access denials, admin actions; alert on anomalies; protect logs from tampering; don't log secrets.

**Process:** secure coding guidelines, security-focused code review checklist, SAST/dependency scanning in CI, DAST/pen testing for critical apps, threat modelling for new features, and a vulnerability disclosure process."

#### Another worked example: an IDOR bug
"In a B2B app, `GET /api/reports/{id}/download` checked that the user was logged in but not which tenant owned the report. A customer noticed sequential IDs and could download other companies' reports. Fixes: tenant-scoped queries enforced in the data access layer (every repository method requires a tenant ID), random IDs, automated tests asserting cross-tenant access returns 404, and an audit of all endpoints. We also checked logs to identify any accessed data for disclosure."

#### A third worked example: SSRF via webhooks
"A webhook feature let customers register callback URLs. A security researcher registered `http://localhost:8080/admin/flush-cache` and `http://169.254.169.254/latest/meta-data/`. Our fix: validate URLs (HTTPS only, public DNS names), resolve and reject private IP ranges at connection time, send webhooks via an egress proxy in an isolated network with no internal access, and enable IMDSv2."

#### Variations you might be asked
- "What's XSS and is it a backend concern?": cross-site scripting injects scripts into pages; backends contribute by returning unescaped user content or wrong content types, and by setting security headers (CSP).
- "What's CSRF?": tricking a logged-in user's browser into sending a state-changing request; prevented with SameSite cookies, CSRF tokens, and not using cookies for API auth where possible.
- "How do you prioritise vulnerabilities?": by exploitability and impact (CVSS plus context), fixing internet-facing critical issues first.

#### Step-by-step framework
1. **Explain what OWASP Top 10 is.**
2. **Pick the most relevant risks** for APIs.
3. **Give an example attack** for each.
4. **Give concrete prevention.**
5. **Add process measures.**
6. **Mention defence in depth.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Lists names | Explains attacks and defences |
| "Use a firewall" | Code-level controls (authz checks, parameterised queries) |
| Ignores access control | Highlights IDOR as most common |
| No SSRF awareness | SSRF with metadata endpoint example |
| No process | Threat modelling, scanning, reviews |

#### Useful phrases
- "Authentication tells me who you are; authorisation must be checked for every object."
- "I never build queries by concatenating user input."
- "Any feature that fetches URLs is an SSRF risk."
- "We threat model new features, not just scan code."

#### Common pitfalls
- **Authorisation only in the UI.**
- **Detailed error messages** leaking internals.
- **Outdated dependencies.**
- **Trusting internal networks.**

#### Follow-ups to expect (with sample answers)
- **"How would you test for broken access control?"**
  "Automated tests with two users/tenants for every endpoint, plus manual testing and pen tests; tools can help but logic flaws need deliberate tests."
- **"What's STRIDE?"**
  "A threat modelling framework: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege."
- **"How do you handle a reported vulnerability?"**
  "Triage severity, reproduce, fix and deploy, assess whether it was exploited (logs), notify if required, and add regression tests."

#### What senior interviewers look for
- **Practical security mindset.**
- **Specific defensive patterns.**
- **Security in the development lifecycle.**

#### Practise it
1. For an API you know, find one possible IDOR and describe the fix.
2. Explain SSRF and its prevention, out loud.
3. Write a security code review checklist with 10 items.

## Preventing SQL injection and validating input
- id: be-sec-02
- round: SECURITY
- difficulty: easy
- levels:
- tags: SQL injection, input validation, parameterised queries, sanitisation

### Prompt
How does SQL injection work, and how do you prevent it? More broadly, how do you validate and handle untrusted input in a backend service?

### Answer
#### What the interviewer is really testing
- Understanding injection mechanics with a **concrete example**.
- **Parameterised queries** as the primary defence, and their limits (identifiers, `ORDER BY`).
- **Input validation** principles: allow-lists, schemas, types, sizes.
- Distinguishing **validation** (reject bad input) from **output encoding** (safe rendering in a context).

#### Key points
- SQL injection happens when **user input is concatenated** into SQL, allowing attackers to change the query's structure.
- Primary defence: **parameterised queries / prepared statements**: the query structure is fixed; input is sent separately as data.
- ORMs parameterise by default, but **raw query** escape hatches can still be vulnerable.
- Identifiers (table/column names, `ORDER BY` fields) can't be parameterised: use an **allow-list mapping**.
- **Least privilege** database accounts limit damage.
- Validate input at the boundary: **schema validation** (types, ranges, lengths, formats, enums), reject unknown fields, size limits.
- **Encode output** for its context (HTML, SQL, shell, logs); validation alone isn't enough.
- Same principles apply to NoSQL, command, LDAP, template and log injection.

#### Model answer
"**How SQL injection works.** If code builds SQL by concatenating input:
```python
# VULNERABLE
query = f"SELECT * FROM users WHERE email = '{email}' AND password_hash = '{h}'"
```
An attacker submits `email = "admin@example.com' --"`. The query becomes:
```sql
SELECT * FROM users WHERE email = 'admin@example.com' --' AND password_hash = '...'
```
The `--` comments out the password check. Other payloads can dump tables (`UNION SELECT`), modify data, or with some databases execute commands. Even 'blind' injection (no visible output) can extract data via timing or boolean responses.

**Primary defence: parameterised queries.**
```python
cur.execute(
    "SELECT id, password_hash FROM users WHERE email = %s",
    (email,),                          # sent separately as data, never parsed as SQL
)
```
The database parses the query structure first; parameters are bound as values, so input can't change the structure, whatever characters it contains.

With an ORM:
```python
User.objects.filter(email=email)                    # safe
User.objects.raw(f"... WHERE email = '{email}'")    # vulnerable escape hatch
User.objects.raw("... WHERE email = %s", [email])   # safe
```

**Things parameters can't do: identifiers and keywords.** You can't parameterise a column name in `ORDER BY` or a table name. Use an **allow-list**:
```python
SORT_COLUMNS = {"created": "created_at", "price": "price_cents", "name": "name"}
col = SORT_COLUMNS.get(request.args.get("sort"), "created_at")
direction = "DESC" if request.args.get("dir") == "desc" else "ASC"
cur.execute(f"SELECT * FROM products ORDER BY {col} {direction} LIMIT %s", (limit,))
```
User input selects from known-safe values; it never appears in the SQL itself.

**Defence in depth:**
- **Least privilege** DB users: the app user can't drop tables or read other schemas; separate read-only users for reporting.
- Avoid dynamic SQL in stored procedures.
- **SAST** tools and code review flag string-built queries.
- Generic error messages to clients (SQL errors reveal structure).
- WAFs can block obvious payloads but are not a substitute.

**Input validation more broadly.** Treat all external input as untrusted: request bodies, query params, headers, cookies, file uploads, webhook payloads, and even data from other internal services or databases that users influenced.

Principles:
- **Validate at the boundary** with a schema: types, required fields, ranges, lengths, formats, enums. Reject unknown fields to avoid mass-assignment bugs (e.g. a user setting `is_admin: true`).
```python
from pydantic import BaseModel, EmailStr, Field, conint

class CreateOrder(BaseModel):
    model_config = {"extra": "forbid"}         # reject unexpected fields
    email: EmailStr
    product_id: conint(gt=0)
    quantity: conint(ge=1, le=100)
    note: str = Field(default="", max_length=500)
```
- **Allow-lists over deny-lists**: define what's valid rather than trying to block bad patterns.
- **Size limits**: request body size, array lengths, string lengths, file sizes, to prevent resource exhaustion.
- **Canonicalise** before validating (Unicode normalisation, path normalisation to prevent `../` traversal).
- **File uploads**: check type by content (not just extension), limit size, store outside the web root with generated names, scan if needed.

**Validation vs output encoding.** Validation ensures input is well-formed; it doesn't make data safe in every context. A valid name like `O'Brien` or `<script>` in a comment field must be handled safely by **encoding for the output context**: parameterised queries for SQL, HTML escaping for web pages, argument arrays (not shell strings) for commands, structured logging to avoid log injection (newlines forging log entries).

**Other injection types:**
- **NoSQL injection**: passing objects like `{"$ne": null}` into MongoDB queries; validate types strictly.
- **Command injection**: `os.system("convert " + filename)`; use `subprocess.run(["convert", filename])` without a shell.
- **Template injection**: rendering user input as a template."

#### Another worked example: injection through sorting
"An API used an ORM everywhere, so the team believed it was immune to SQL injection. But a reporting endpoint built `ORDER BY` from a query parameter: `?sort=created_at;DROP TABLE...` didn't work (multiple statements blocked) but `?sort=(CASE WHEN (SELECT substring(password_hash,1,1) FROM users LIMIT 1)='a' THEN name ELSE price END)` allowed blind data extraction. Fix: an allow-list mapping for sort fields, and a code search for all raw SQL fragments."

#### A third worked example: mass assignment
"A profile update endpoint passed the whole JSON body to `user.update(**body)`. A user sent `{"name": "Sam", "role": "admin"}` and became an admin. Fix: explicit request schemas with only allowed fields (`extra = forbid`), and separate admin endpoints for role changes with proper authorisation."

#### Variations you might be asked
- "Is escaping input enough to prevent SQL injection?": manual escaping is error-prone (encodings, edge cases); parameterisation is the reliable approach.
- "Should you validate on the client or the server?": both for UX, but only server-side validation is a security control.
- "How do you prevent path traversal?": never use raw user input in file paths; map IDs to paths, or normalise and verify the path stays within an allowed directory.

#### Step-by-step framework
1. **Explain SQL injection** with an example.
2. **Parameterised queries** as primary defence.
3. **Allow-lists for identifiers.**
4. **Defence in depth** (least privilege, errors, scanning).
5. **Schema validation** at boundaries.
6. **Output encoding** and other injection types.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Escape quotes" | Parameterised queries |
| "We use an ORM so we're safe" | Knows raw query and ORDER BY risks |
| Deny-list of bad characters | Allow-list schemas |
| Validation only | Validation + context-specific encoding |
| SQL only | NoSQL, command, path, log injection |

#### Useful phrases
- "Parameters keep data separate from the query structure."
- "Column names can't be parameterised, so I map user choices to an allow-list."
- "Validate input, encode output."
- "Reject unknown fields to prevent mass assignment."

#### Common pitfalls
- **Raw SQL fragments** in ORM code.
- **Client-side validation only.**
- **Shell commands with string interpolation.**
- **Overly permissive DB accounts.**

#### Follow-ups to expect (with sample answers)
- **"How do prepared statements work?"**
  "The database parses and plans the query with placeholders; parameters are bound later as values, so they're never parsed as SQL."
- **"How do you find SQL injection in a large codebase?"**
  "SAST tools, searching for string-formatted queries and raw query APIs, and DAST/pen testing on endpoints."
- **"What's second-order SQL injection?"**
  "Malicious input stored safely, then later used unsafely in a different query; parameterise every query, not just those handling direct input."

#### What senior interviewers look for
- **Correct, specific defences.**
- **Awareness of edge cases** beyond the basic example.
- **Systematic input handling.**

#### Practise it
1. Write a vulnerable query, exploit it locally, then fix it with parameters.
2. Implement safe dynamic sorting with an allow-list.
3. Write a request schema that rejects unknown fields for an endpoint you know.

## Secrets management
- id: be-sec-03
- round: SECURITY
- difficulty: medium
- levels:
- tags: secrets, vault, KMS, credentials, rotation

### Prompt
How should a backend system manage secrets like database passwords, API keys and signing keys? What are common mistakes, and how do you handle rotation and leaks?

### Answer
#### What the interviewer is really testing
- Knowing where secrets **should and shouldn't** live.
- Using **secret managers**, **KMS**, and **workload identity** to avoid static credentials.
- **Rotation**, least privilege, auditing.
- A clear **incident response** for leaked secrets.

#### Key points
- **Never** commit secrets to git, bake them into container images, or log them.
- Store in a **secret manager** (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, Azure Key Vault); access controlled by IAM, audited.
- Prefer **no long-lived secrets**: **workload identity / IAM roles**, OIDC federation for CI, short-lived dynamic credentials (Vault database secrets).
- **KMS** for encryption keys; **envelope encryption**.
- **Least privilege**: separate secrets per service and environment.
- **Rotation**: automated, with overlapping validity (dual credentials) for zero downtime.
- **Leak response**: revoke/rotate immediately, assess usage via audit logs, remove from history, add prevention (secret scanning).

#### Model answer
"**Where secrets should not be:**
- **Source code or git history**: even private repos get cloned, forked, leaked; bots scan public GitHub within minutes.
- **Container images**: anyone with registry access can extract them.
- **Plain environment files committed** or shared in chat/wiki.
- **Logs, error messages, URLs** (query strings get logged).
- **Client-side code**: anything shipped to browsers or mobile apps is public.

**Where they should be:**
- A **secret manager** (Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault):
  - Encrypted at rest, access controlled by IAM policies per service, **audited** (who read what, when).
  - Versioning and rotation support.
- Applications fetch secrets at startup or runtime (SDK, sidecar/agent, or CSI driver mounting them as files in Kubernetes), keeping them in memory.
- Kubernetes Secrets alone are base64-encoded, not encrypted by default; enable encryption at rest and ideally sync from an external secret manager (External Secrets Operator).

**Better still: eliminate static secrets.**
- **Workload identity**: services authenticate to cloud resources with their IAM role (AWS IAM roles for service accounts, GCP workload identity), getting short-lived credentials automatically. No keys to leak.
- **CI/CD via OIDC federation**: GitHub Actions obtains temporary cloud credentials without stored keys.
- **Dynamic database credentials**: Vault generates unique, short-lived DB users per service instance, revoked automatically.
- **IAM database authentication** (e.g. RDS IAM auth) where supported.

**Encryption keys and KMS:**
- Signing keys and data encryption keys belong in a **KMS or HSM**, where they can be used without being extracted.
- **Envelope encryption**: data encrypted with a data key; the data key encrypted by a KMS master key. Rotating the master key doesn't require re-encrypting all data.

**Least privilege and separation:**
- Separate secrets per **service and environment** (staging can't read production secrets).
- Each service's identity can read only its own secrets.
- Third-party API keys scoped to minimum permissions (read-only keys where possible).

**Rotation:**
- Rotate regularly and automatically; rotation that requires downtime won't happen.
- Zero-downtime pattern (**dual credentials**):
  1. Create a new credential while the old one remains valid.
  2. Update the secret manager; applications pick up the new value (reload on change or on restart).
  3. Verify all instances use the new credential (monitor auth with old one).
  4. Revoke the old credential.
- For JWT signing keys: publish multiple keys via JWKS with key IDs (`kid`); sign with the new key while still accepting the old until tokens expire.

**When a secret leaks:**
1. **Revoke/rotate immediately**: assume it's compromised, even if the repo was private or the commit was deleted.
2. **Assess**: audit logs for use of the credential (cloud trail, provider dashboards), scope of access, data accessed.
3. **Contain** any misuse; follow incident and disclosure processes if data was accessed.
4. **Clean up**: remove from git history (BFG/filter-repo), though rotation is what actually protects you.
5. **Prevent**: pre-commit hooks and CI **secret scanning** (gitleaks, GitHub secret scanning with push protection), training, and moving the secret to a manager.

**Operational detail:** never print secrets in logs; redact known secret patterns in logging libraries; avoid passing secrets on command lines (visible in process lists)."

#### Another worked example: a leaked AWS key
"A developer committed an AWS access key to a public repo by mistake. Within 12 minutes, automated bots used it to launch crypto-mining instances in multiple regions. AWS flagged the key, we revoked it, terminated the instances, and checked CloudTrail for other actions (none on data). Follow-ups: removed all long-lived IAM user keys in favour of SSO and OIDC for CI, enabled GitHub push protection, and set billing anomaly alerts. Cost: $3,800 in compute, refunded partially."

#### A third worked example: rotating a database password without downtime
"Our database password hadn't been rotated in three years because 'it would cause downtime'. We introduced dual users (`app_a`, `app_b`): the secret manager rotates the inactive user's password, flips the active secret, and applications reload credentials on connection pool refresh. Rotation became a monthly automated job with zero downtime. Later we moved to IAM authentication with 15-minute tokens."

#### Variations you might be asked
- "Should environment variables hold secrets?": common and acceptable when injected at runtime from a secret manager, but they can leak via crash dumps, debug endpoints and child processes; mounted files or SDK fetches are slightly better.
- "How do you give developers access to production secrets?": ideally they don't need it; use break-glass access with approval, time limits and auditing.
- "How do you manage secrets locally for development?": separate development credentials, fetched via the secret manager CLI, never production secrets on laptops.

#### Step-by-step framework
1. **Where secrets must not live.**
2. **Secret manager** with IAM and auditing.
3. **Eliminate static secrets** (workload identity, OIDC, dynamic creds).
4. **KMS** for keys, envelope encryption.
5. **Rotation** with dual credentials.
6. **Leak response** and prevention.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| ".env file in the repo" | Secret manager with IAM and audit |
| Long-lived keys everywhere | Workload identity, OIDC, short-lived creds |
| Never rotates | Automated zero-downtime rotation |
| "Delete the commit" after a leak | Revoke first, audit usage, then clean up |
| Shared secrets across environments | Per-service, per-environment least privilege |

#### Useful phrases
- "The best secret is one that doesn't exist: use workload identity."
- "If it was committed, it's compromised; rotate first."
- "Rotation must be automatic and zero-downtime, or it won't happen."
- "Keys stay in the KMS; we ask it to sign or decrypt."

#### Common pitfalls
- **Secrets in images or git.**
- **Logging request headers** with tokens.
- **Shared credentials** across services.
- **Manual rotation** that never happens.

#### Follow-ups to expect (with sample answers)
- **"How do apps pick up rotated secrets?"**
  "Reload on a schedule or on change notification, or restart gradually; connection pools re-authenticate on new connections."
- **"What is envelope encryption?"**
  "Encrypt data with a data key, encrypt the data key with a master key in KMS, store the encrypted data key alongside the data."
- **"How do you detect secrets in code?"**
  "Pre-commit hooks and CI scanners with pattern and entropy detection, plus provider-side scanning with push protection."

#### What senior interviewers look for
- **Modern practices** (identity over secrets).
- **Operational maturity** (rotation, auditing).
- **Calm, correct incident response.**

#### Practise it
1. Audit a project you know: list every secret and where it lives.
2. Design a zero-downtime rotation for a third-party API key.
3. Explain what to do in the first hour after a secret leak, out loud.

## Designing authorisation: RBAC and ABAC
- id: be-sec-04
- round: SECURITY
- difficulty: medium
- levels:
- tags: authorisation, RBAC, ABAC, ReBAC, permissions, multi-tenancy

### Prompt
Design the authorisation model for a multi-tenant SaaS application. Compare RBAC, ABAC and relationship-based access control, and explain how you'd enforce permissions in code.

### Answer
#### What the interviewer is really testing
- Distinguishing **authentication** from **authorisation**.
- Knowing **RBAC, ABAC, ReBAC** and when each fits.
- **Tenant isolation** as a non-negotiable layer.
- Enforcing consistently: **centralised policy, deny by default, object-level checks, testing, auditing**.

#### Key points
- **Authentication:** who are you? **Authorisation:** what are you allowed to do?
- **RBAC (role-based):** users get roles; roles grant permissions (`admin`, `editor`, `viewer`). Simple, understandable; can suffer **role explosion**.
- **ABAC (attribute-based):** decisions based on attributes of user, resource, action and context (department, owner, region, time). Flexible; harder to reason about.
- **ReBAC (relationship-based):** permissions derived from relationships (user is member of team that owns folder containing document), as in Google Zanzibar (OpenFGA, SpiceDB). Good for sharing and hierarchies.
- Often combined: **tenant isolation** + RBAC for coarse permissions + ownership/ABAC/ReBAC rules for objects.
- Enforce **server-side**, per request and per object; **deny by default**; centralise in a policy layer (OPA, Cedar, Casbin, or a module).
- **Audit logs** for permission changes and sensitive actions; test permissions systematically.

#### Model answer
"**Authentication vs authorisation.** Authentication verifies identity (login, tokens). Authorisation decides whether that identity can perform an action on a resource. Most real security bugs are authorisation bugs: correctly identified users accessing things they shouldn't.

**Layer 1: tenant isolation (non-negotiable).**
- Every resource belongs to a tenant (organisation). Every query is scoped by `tenant_id` derived from the authenticated session, never from the request body.
- Enforce in the **data access layer** so developers can't forget: repository methods require a tenant context; or use **PostgreSQL row-level security** policies:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```
- Cross-tenant access returns **404** (not 403) to avoid leaking existence.

**Layer 2: RBAC for coarse permissions.**
- Roles per tenant: `owner`, `admin`, `member`, `viewer`, `billing`.
- Roles map to permissions: `documents:read`, `documents:write`, `users:invite`, `billing:manage`.
- Check **permissions, not roles**, in code (`can(user, 'documents:write')`), so roles can change without code changes.
- Schema:
```
users(id, ...)
memberships(user_id, tenant_id, role)
role_permissions(role, permission)
```
- **Pros:** simple, auditable, matches how admins think. **Cons:** role explosion when you need 'editor of project X but viewer of project Y'.

**Layer 3: object-level rules (ABAC or ReBAC).**
- **ABAC**: rules on attributes, e.g. 'members can edit documents they own', 'support agents can view tickets in their region during business hours', 'documents classified confidential require the `confidential` clearance'.
```python
def can_edit(user, doc) -> bool:
    if doc.tenant_id != user.tenant_id:
        return False
    if "documents:write:any" in user.permissions:      # admins
        return True
    return "documents:write:own" in user.permissions and doc.owner_id == user.id
```
- **ReBAC**: for sharing and hierarchies (Google Drive-like): 'user can view a document if they're a viewer of it, or a member of a team with access, or have access to the parent folder'. Systems like **OpenFGA/SpiceDB** (inspired by Google Zanzibar) store relationship tuples (`document:42#viewer@team:design#member`) and answer `check(user, permission, object)` efficiently, including 'list all objects user can see'.

**Choosing:**
| Model | Best for | Watch out for |
|---|---|---|
| RBAC | Standard admin/member/viewer apps | Role explosion |
| ABAC | Context-sensitive rules (ownership, region, classification) | Complex, harder to audit |
| ReBAC | Sharing, nested groups, hierarchies | Extra infrastructure, consistency |
For most SaaS: tenant isolation + RBAC + a few ownership rules. ReBAC when users share individual resources or have nested groups.

**Enforcement in code:**
- **Centralise** decisions in a policy module or engine (OPA/Rego, AWS Cedar, Casbin, Oso, or a well-tested internal library), called from every endpoint: `authorize(user, action, resource)`.
- **Deny by default**: new endpoints are inaccessible until permissions are declared.
- **Check at the right point**: load the resource (scoped by tenant), then authorise against its attributes, before acting. For lists, filter in the query (don't fetch everything and filter in memory).
- **Don't trust client-provided roles or tenant IDs**; derive from the session/token and fresh database state for sensitive actions (tokens may be stale after role changes).
- **Admin and support access**: separate, audited 'impersonation' with reason codes and time limits.
- **Audit logs**: role changes, permission grants, sensitive reads/exports.
- **Testing**: a permission matrix test suite: for each endpoint × role (× tenant), assert allowed/denied. Run in CI.

**Example request flow:**
1. Middleware authenticates the token → `user_id`, `tenant_id`.
2. Loads membership and permissions (cached briefly).
3. Handler loads the document with `WHERE id = :id AND tenant_id = :tenant`.
4. `authorize(user, 'document:edit', doc)` → allow/deny.
5. Action performed; audit event recorded."

#### Another worked example: role explosion
"A project management SaaS started with three roles. Customers asked for 'can edit tasks but not delete', 'can view only their team's projects', 'external contractors see only assigned tasks'. The team created 27 roles, which became unmanageable. They moved to per-project roles (membership on projects with `editor/viewer`) plus permission sets, and modelled sharing with ReBAC in OpenFGA, reducing global roles to four."

#### A third worked example: stale permissions in JWTs
"Permissions were embedded in JWTs valid for 24 hours. When an admin removed a fired employee's access, the employee kept access until the token expired. Fixes: short-lived access tokens (10 minutes) with refresh checks, and for sensitive operations, checking current membership in the database. Also added immediate session revocation for removed users."

#### Variations you might be asked
- "Where should authorisation live in microservices?": each service enforces for its own resources, using a shared policy engine or library and identity propagated in tokens; a gateway can do coarse checks only.
- "How do you implement 'list documents I can see' efficiently?": filter in the database query by tenant and ownership/membership joins, or use ReBAC systems with list APIs; avoid per-item checks after fetching everything.
- "What's the principle of least privilege?": grant only the permissions required, for the shortest time needed.

#### Step-by-step framework
1. **Separate authn and authz.**
2. **Tenant isolation** enforced in data layer.
3. **RBAC** with permissions, not role checks.
4. **Object-level rules** via ABAC/ReBAC.
5. **Centralised enforcement**, deny by default.
6. **Audit and test** with a permission matrix.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `if user.role == 'admin'` scattered | Central `authorize()` with permissions |
| Tenant ID from request body | Tenant from session, enforced in queries/RLS |
| Only RBAC | RBAC + object rules, knows ABAC/ReBAC |
| Authorisation in the UI | Server-side, per object |
| No tests | Permission matrix tests in CI |

#### Useful phrases
- "Tenant isolation is the first layer, enforced in the data access layer."
- "Code checks permissions, not role names."
- "Deny by default, so new endpoints are safe until configured."
- "For sharing and hierarchies, relationship-based access control fits best."

#### Common pitfalls
- **Missing object-level checks** (IDOR).
- **Stale permissions** in long-lived tokens.
- **Role explosion.**
- **Filtering lists in memory.**

#### Follow-ups to expect (with sample answers)
- **"403 or 404 for unauthorised access?"**
  "404 for resources in other tenants (don't reveal existence); 403 when the user can see the resource but lacks permission for the action."
- **"How do you handle super-admin access for support?"**
  "Separate admin tooling, explicit impersonation with justification, time-limited, fully audited, and visible to the customer if required."
- **"What's OPA?"**
  "Open Policy Agent: a general-purpose policy engine where rules are written in Rego and evaluated by services or sidecars."

#### What senior interviewers look for
- **Layered, scalable models.**
- **Consistent enforcement** and testing.
- **Multi-tenant security instincts.**

#### Practise it
1. Design roles and permissions for a SaaS you know; write the permission matrix.
2. Write a PostgreSQL RLS policy for tenant isolation.
3. Explain RBAC vs ABAC vs ReBAC with examples, out loud.

## Encryption in transit and at rest
- id: be-sec-05
- round: SECURITY
- difficulty: medium
- levels:
- tags: encryption, TLS, KMS, envelope encryption, hashing

### Prompt
Explain how you'd protect data in transit and at rest in a backend system. When do you use TLS, disk/database encryption, application-level (field) encryption, and hashing?

### Answer
#### What the interviewer is really testing
- Understanding **what each layer of encryption protects against** (and what it doesn't).
- TLS fundamentals: **certificates, handshake, versions**, HSTS.
- At-rest options: **storage/disk encryption, database TDE, application-level/field encryption**, **envelope encryption** with KMS.
- Choosing **encryption vs hashing** correctly (passwords, tokens), and key management/rotation.

#### Key points
- **In transit:** TLS 1.2+ (prefer 1.3) for all external and internal traffic; valid certificates; HSTS; disable weak ciphers; mTLS for service-to-service when needed.
- **At rest — storage level:** cloud disk/volume, S3 and managed database encryption (usually on by default). Protects against stolen disks/backups, **not** against someone with database access.
- **Application-level / field encryption:** encrypt sensitive fields (national IDs, bank details, health data) in the app before storing; protects against DB dumps, over-privileged access and some insider threats; costs searchability.
- **Envelope encryption:** data encrypted with a data key (DEK); DEK encrypted with a key-encryption key (KEK) in KMS/HSM.
- **Hashing** (one-way): passwords with **Argon2/bcrypt/scrypt** (slow, salted); tokens/API keys with SHA-256 (high entropy); **HMAC** for integrity.
- Use **authenticated encryption** (AES-GCM, ChaCha20-Poly1305); never roll your own crypto; use vetted libraries (libsodium/Tink).
- **Key management:** KMS, least-privilege access, rotation, audit logs, separation of keys from data.

#### Model answer
"I think in terms of **threats**: each layer of encryption protects against specific attackers.

**1. Encryption in transit: TLS.**
- Protects against eavesdropping and tampering on the network (public Wi-Fi, compromised routers, cloud network snooping).
- **Externally:** HTTPS everywhere with TLS 1.2+ (prefer 1.3), certificates from a trusted CA with automated renewal (Let's Encrypt/ACM), **HSTS** to force HTTPS, redirect HTTP → HTTPS, disable old protocols and weak ciphers.
- **Internally:** don't assume the internal network is safe; encrypt service-to-service, database and cache connections (`sslmode=verify-full` for PostgreSQL, TLS for Redis). Service meshes can provide **mTLS** automatically.
- TLS briefly: the client verifies the server's certificate chain and hostname; they agree on session keys via (EC)DHE, giving **forward secrecy** (past sessions stay safe even if the server key leaks later); data is then encrypted with symmetric authenticated encryption.

**2. Encryption at rest: storage level.**
- Disk/volume encryption, S3 server-side encryption, managed database encryption (RDS, Cloud SQL), encrypted backups and snapshots.
- Protects against: stolen physical disks, improperly disposed hardware, leaked snapshots/backups (if keys are separate).
- Does **not** protect against: anyone who can query the database or read files through the running system, i.e. a SQL injection, a compromised app server or an over-privileged employee sees plaintext.
- It's cheap and usually default; enable it everywhere and use customer-managed KMS keys for sensitive data so access to keys is controlled and audited.

**3. Application-level (field-level) encryption.**
- Encrypt specific sensitive fields in the application before writing them: national ID numbers, bank account details, health records, API credentials for customers' integrations.
- Protects against: database dumps, read replicas or analytics copies being accessed, DBAs and broad internal access, backups leaking even with DB credentials.
- Trade-offs: you can't query, index or sort encrypted values directly. Patterns:
  - **Blind index**: store an HMAC of the normalised value for exact-match lookups (e.g. find a user by national ID).
  - Keep only the minimum in encrypted form; show last 4 digits stored separately if needed.
- **Envelope encryption** with KMS:
```python
# Encrypt
data_key = kms.generate_data_key(KeyId=KEK_ID, KeySpec="AES_256")
ciphertext = aes_gcm_encrypt(data_key.plaintext, plaintext, aad=record_id)
store(ciphertext, encrypted_key=data_key.ciphertext_blob, key_id=KEK_ID)
# plaintext data key discarded from memory after use

# Decrypt
data_key = kms.decrypt(CiphertextBlob=row.encrypted_key)
plaintext = aes_gcm_decrypt(data_key.plaintext, row.ciphertext, aad=record_id)
```
  - The KMS master key never leaves KMS; access is IAM-controlled and audited.
  - Rotating the KEK only requires re-encrypting data keys, not all data.
  - Using **AAD** (additional authenticated data, e.g. record ID) prevents swapping ciphertexts between records.
  - Libraries like **AWS Encryption SDK or Google Tink** implement this safely; caching data keys reduces KMS calls.

**4. Hashing: when you never need the original.**
- **Passwords:** never encrypt (reversible); hash with a slow, salted, memory-hard algorithm (**Argon2id**, bcrypt, scrypt) with appropriate cost parameters, so leaked hashes are expensive to crack.
- **API keys, password reset tokens, session tokens:** store a **SHA-256 hash** of the token (they're high-entropy random values, so a fast hash is fine); compare hashes on use. A database leak then doesn't expose usable tokens.
- **HMAC** for integrity and authenticity (webhook signatures, signed URLs), compared in constant time.

**Choosing:**
| Need | Technique |
|---|---|
| Protect data on the network | TLS (mTLS internally if needed) |
| Protect against lost disks/backups | Storage/DB encryption with KMS |
| Protect specific sensitive fields from DB-level access | Field-level envelope encryption |
| Verify passwords | Argon2id/bcrypt hashing |
| Verify tokens/API keys | SHA-256 hash of random token |
| Verify message integrity | HMAC / signatures |

**Key management principles:**
- Keys in KMS/HSM, separate from data; least-privilege IAM for decrypt.
- Rotation schedules; key versioning so old data remains decryptable.
- Audit logs on key usage; alerts on unusual decrypt volume.
- Crypto-shredding: deleting a per-tenant or per-user key makes their data unrecoverable (useful for deletion requests)."

#### Another worked example: field encryption for bank details
"A payroll platform stored employee bank account numbers in a column readable by analytics replicas and support tools. We implemented envelope encryption per tenant (one KMS key per tenant), stored a blind index for duplicate detection, and exposed only the last 4 digits to support tools. Analytics replicas now contain ciphertext only. The payroll export service is the only identity allowed to call KMS decrypt, and every decrypt is audited."

#### A third worked example: storing API tokens safely
"A developer platform stored customer API tokens in plaintext so they could be 'shown again'. After a security review, tokens became `prefix + random 32 bytes`, shown once at creation; the database stores only the prefix (for identification) and a SHA-256 hash. Lookups hash the presented token and compare. A later database read-only exposure in a test environment revealed no usable tokens."

#### Variations you might be asked
- "Symmetric vs asymmetric encryption?": symmetric (AES) uses one shared key and is fast for bulk data; asymmetric (RSA, ECC) uses public/private keys for key exchange and signatures.
- "Why not encrypt passwords?": encryption is reversible; anyone with the key gets every password. Hashing with slow algorithms makes recovery impractical.
- "What's end-to-end encryption?": only the communicating clients hold keys; the server can't read content (e.g. Signal), which limits server-side features like search.

#### Step-by-step framework
1. **Identify threats** for the data.
2. **TLS everywhere**, including internally.
3. **Storage encryption** by default with KMS.
4. **Field-level envelope encryption** for highly sensitive data.
5. **Hash** passwords and tokens correctly.
6. **Key management**: KMS, rotation, audit, least privilege.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "The database is encrypted, so we're safe" | Explains what disk encryption doesn't protect against |
| Encrypts passwords | Argon2id/bcrypt hashing |
| Hard-coded keys | KMS with envelope encryption |
| TLS only at the edge | TLS internally too |
| Custom crypto | Vetted libraries, authenticated encryption |

#### Useful phrases
- "Disk encryption protects lost disks, not a compromised application."
- "For the most sensitive fields, we encrypt in the application with envelope encryption."
- "Passwords are hashed, never encrypted."
- "Keys live in KMS, separate from the data they protect."

#### Common pitfalls
- **Assuming at-rest encryption stops breaches.**
- **Plaintext internal traffic.**
- **Fast hashes for passwords.**
- **Keys stored alongside data.**

#### Follow-ups to expect (with sample answers)
- **"How do you search encrypted fields?"**
  "Blind indexes (HMAC of normalised values) for exact matches; for anything richer, reconsider whether the field must be searchable or use specialised approaches."
- **"What's forward secrecy?"**
  "Session keys derived from ephemeral key exchange, so compromising the server's long-term key later doesn't decrypt past traffic."
- **"How do you rotate an encryption key?"**
  "Create a new key version for new encryptions; re-encrypt data keys (or data) in the background; keep old versions for decryption until migration completes."

#### What senior interviewers look for
- **Threat-based reasoning.**
- **Correct primitives** for each purpose.
- **Practical key management.**

#### Practise it
1. For a system you know, list sensitive data and choose protection for each.
2. Explain envelope encryption with a diagram, out loud.
3. Explain why passwords use Argon2id but API tokens can use SHA-256.

## Service-to-service security and mTLS
- id: be-sec-06
- round: SECURITY
- difficulty: medium
- levels:
- tags: mTLS, zero trust, service identity, service mesh, internal auth

### Prompt
In a microservices architecture, how do services authenticate and authorise each other? Explain mTLS, service identity, and zero-trust principles.

### Answer
#### What the interviewer is really testing
- Rejecting **"the internal network is trusted"** thinking.
- Understanding **mTLS** and **workload identity** (SPIFFE, service accounts).
- **Authorisation between services** (which service may call which endpoint), and propagating **end-user identity**.
- Operational concerns: certificate rotation, service mesh trade-offs, network policies as defence in depth.

#### Key points
- **Zero trust:** never trust based on network location; authenticate and authorise every request; least privilege; assume breach.
- **mTLS (mutual TLS):** both client and server present certificates; gives **encryption + mutual authentication** of service identities.
- **Service identity:** each workload gets a cryptographic identity (e.g. SPIFFE ID `spiffe://prod/ns/payments/sa/payments-api`), issued and rotated automatically (short-lived certificates).
- **Service meshes** (Istio, Linkerd) provide mTLS, identity and policy via sidecars without code changes.
- **Authorisation policies:** allow-lists of which services can call which services/endpoints.
- **End-user context:** propagate a signed token (JWT) describing the user so downstream services can enforce user-level authorisation, avoiding the **confused deputy** problem.
- **Defence in depth:** network policies (Kubernetes NetworkPolicy, security groups), egress controls, audit logs.

#### Model answer
"**Why internal security matters.** In the traditional 'castle and moat' model, anything inside the network is trusted. But attackers who compromise one service (via a vulnerable dependency, SSRF, or stolen credentials) can then call every internal service freely. **Zero trust** says: authenticate and authorise every call, regardless of network location, with least privilege, and assume a breach can happen.

**Service authentication options:**
1. **mTLS (mutual TLS):** in normal TLS, only the server proves its identity. In mTLS, the client also presents a certificate, so each side knows exactly which service it's talking to, and traffic is encrypted.
   - Each workload gets a certificate encoding its identity, e.g. a **SPIFFE ID** `spiffe://example.org/ns/prod/sa/orders`.
   - Certificates are **short-lived** (hours) and rotated automatically by an internal CA (mesh control plane, SPIRE, cert-manager).
2. **Signed service tokens:** services obtain short-lived JWTs from an identity provider (OAuth 2.0 client credentials, or cloud workload identity tokens) and send them as bearer tokens; receivers validate signature, audience and expiry.
3. Static API keys between services: simplest but weakest (long-lived, shared, hard to rotate); avoid for anything important.

**Service mesh approach.** A mesh (Istio, Linkerd) injects sidecar proxies that:
- Automatically establish mTLS between services with identity tied to Kubernetes service accounts.
- Enforce **authorisation policies**:
```yaml
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: payments-allow, namespace: prod }
spec:
  selector: { matchLabels: { app: payments } }
  action: ALLOW
  rules:
    - from: [{ source: { principals: ["cluster.local/ns/prod/sa/orders"] } }]
      to:   [{ operation: { methods: ["POST"], paths: ["/v1/charges"] } }]
```
  Only the orders service may `POST /v1/charges` on payments; everything else is denied.
- Provide metrics and audit of service-to-service calls.
- Trade-offs: operational complexity, extra latency (~1 ms per hop), resource overhead; ambient/sidecarless modes reduce some costs.

**Service-level vs user-level authorisation.** mTLS tells payments that *orders* is calling, but not *on behalf of which user*. If payments trusts any request from orders, a bug or compromise in orders could charge any customer: the **confused deputy** problem. So:
- Propagate end-user identity as a **signed token** (the original access token, or a token exchanged for an internal one with narrower scope/audience, per OAuth token exchange).
- Downstream services verify the token and enforce user-level authorisation ('can this user act on this order?') in addition to service-level policy.
- Never pass user identity as an unsigned header (`X-User-Id`) that any compromised service could forge, unless it's set and verified at a trusted boundary and protected by mTLS policies.

**Defence in depth:**
- **Network policies:** default-deny Kubernetes NetworkPolicies or security groups, allowing only expected traffic.
- **Egress controls:** services can only reach the external domains they need (limits data exfiltration and SSRF impact).
- **Least privilege for cloud access** via workload identity per service.
- **Audit logs** of service calls and policy denials; alerts on unexpected call patterns.
- Secrets and certificates never baked into images.

**Rolling it out incrementally:**
1. Inventory service dependencies (from tracing data).
2. Enable mTLS in permissive mode (accept both), then strict.
3. Add authorisation policies in audit/dry-run mode, review denials, then enforce.
4. Add user-token propagation for sensitive services (payments, user data)."

#### Another worked example: limiting blast radius
"An attacker exploited a vulnerable image-processing library in a thumbnail service. Because the cluster enforced mTLS with deny-by-default authorisation policies, the thumbnail service could only call the storage service's read endpoint, and egress was limited to the CDN. The attacker couldn't reach the user database or payments, and the breach was contained to one service, detected by policy-denial alerts."

#### A third worked example: a confused deputy bug
"A reporting service called the users service with its own service credentials to fetch user details, passing a `user_id` from the request. A bug allowed customers to request reports with arbitrary user IDs, and the users service returned data because the reporting service was trusted. Fix: propagate the end user's token to the users service, which enforced tenant and user authorisation itself."

#### Variations you might be asked
- "What's SPIFFE?": a standard for workload identity: SPIFFE IDs and SVIDs (X.509 certificates or JWTs) issued to workloads, with SPIRE as a reference implementation.
- "mTLS vs JWT for service auth?": mTLS authenticates the connection at the transport level; JWTs carry claims at the application level and can traverse proxies; many systems use both.
- "How do you handle certificate rotation?": short-lived certificates renewed automatically by the mesh/agent before expiry; monitor expiry and failures.

#### Step-by-step framework
1. **Explain zero trust** and why internal networks aren't trusted.
2. **Service identity** and mTLS (or signed tokens).
3. **Service-level authorisation** policies.
4. **User-level authorisation** via propagated tokens.
5. **Defence in depth** (network policy, egress, audit).
6. **Incremental rollout.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "It's internal, so no auth needed" | Zero trust, assume breach |
| Shared static API keys | mTLS with short-lived workload certificates |
| Authentication only | Service-level authorisation policies |
| Ignores end-user context | Token propagation, confused deputy awareness |
| Big-bang rollout | Permissive → strict, audit → enforce |

#### Useful phrases
- "Network location isn't identity."
- "mTLS tells me which service is calling; the user token tells me on whose behalf."
- "Deny by default between services, then allow what's needed."
- "We roll out policies in audit mode first."

#### Common pitfalls
- **Trusting internal headers.**
- **Long-lived shared credentials.**
- **mTLS without authorisation.**
- **Breaking production by enforcing policies blind.**

#### Follow-ups to expect (with sample answers)
- **"What's the latency cost of mTLS?"**
  "The handshake adds cost per new connection, but with connection reuse it's small; sidecars add roughly a millisecond per hop."
- **"How do you secure calls to managed cloud services?"**
  "Workload identity (IAM roles) and private endpoints, not static keys."
- **"How would you detect lateral movement?"**
  "Monitor service call graphs for unexpected edges, policy denials, unusual egress, and anomalous credential use."

#### What senior interviewers look for
- **Zero-trust mindset.**
- **Understanding both service and user identity.**
- **Practical rollout strategy.**

#### Practise it
1. Draw a call graph for five services and write the authorisation policy for each.
2. Explain the confused deputy problem with an example, out loud.
3. Describe how mTLS works step by step.

## Handling personal data and GDPR in backend systems
- id: be-sec-07
- round: SECURITY
- difficulty: medium
- levels:
- tags: GDPR, privacy, personal data, data deletion, data minimisation

### Prompt
Your service stores personal data about EU users. What does GDPR mean for how you design the backend? How would you implement data export and deletion requests?

### Answer
#### What the interviewer is really testing
- Practical knowledge of **GDPR principles** as they affect engineering (not legal advice).
- **Privacy by design**: minimisation, purpose limitation, retention, access controls.
- Implementing **data subject rights**: access/export, rectification, erasure.
- Hard parts: **data spread across systems**, backups, logs, analytics, third parties, and audit trails.

#### Key points
- **Personal data:** any information relating to an identifiable person (name, email, IP, device IDs, location); **special category** data (health, religion, etc.) needs extra protection.
- Principles: **lawful basis**, **purpose limitation**, **data minimisation**, **accuracy**, **storage limitation (retention)**, **integrity and confidentiality**, **accountability**.
- **Data subject rights:** access (export), rectification, erasure ("right to be forgotten"), restriction, portability, objection; respond within **one month** typically.
- Engineering needs: a **data inventory/map**, retention policies with automated deletion, **pseudonymisation**, encryption, access controls and audit logs, **breach detection** (72-hour notification to regulators).
- Deletion across **all systems**: primary DB, replicas, caches, search indexes, analytics, logs, backups, third-party processors.
- **Data residency** and cross-border transfer considerations.
- Work with legal/privacy teams (DPO); engineers implement, not interpret law alone.

#### Model answer
"I'm not a lawyer, so I'd work with our privacy/legal team on interpretation, but GDPR has very concrete engineering implications.

**Privacy by design principles in the backend:**
- **Data minimisation:** collect only what we need for a stated purpose. Don't store date of birth if we only need 'over 18'; don't log full request bodies containing personal data.
- **Purpose limitation:** data collected for billing shouldn't silently be reused for marketing; track **consent** where it's the lawful basis (with timestamps and versions of consent text).
- **Storage limitation:** define **retention periods** per data type and enforce them automatically (e.g. delete inactive accounts after 3 years, raw access logs after 30 days, keep invoices 7 years for tax law).
- **Security:** encryption in transit and at rest, field-level encryption for sensitive data, least-privilege access, **audit logs** of access to personal data.
- **Pseudonymisation:** replace direct identifiers with internal IDs or tokens in analytics and logs; keep the mapping separate.
- **Data residency:** store EU data in EU regions if required by contracts/policies; be aware of transfer mechanisms for processors outside the EU.

**Foundation: a data inventory.** You can't export or delete what you can't find. I'd maintain a **data map**: every system that stores personal data (primary DB tables, search index, caches, data warehouse, logs, object storage, email provider, CRM, payment provider, support tools), what fields, why, retention, and the user identifier used. Tag schemas/columns with classifications (e.g. `pii: true`) so tooling can find them.

**Implementing data export (right of access/portability):**
- A **workflow service** receives a verified request (identity verification is crucial: exporting someone's data to an attacker is a breach).
- It fans out to each system's **export handler** (each service owns exporting its data) and collects results into a structured, machine-readable format (JSON/CSV) in a secure location.
- Deliver via a time-limited, authenticated download link; log the request and completion.
- Track deadlines (one month) and status in the workflow.

**Implementing deletion (right to erasure):**
- Not absolute: some data must be kept for legal obligations (invoices, fraud prevention records); legal defines exceptions, and we keep only the minimum, possibly restricted.
- **Orchestration:** a deletion request creates a job; an event `user.deletion_requested` is published; each service deletes or anonymises its data and reports completion; the orchestrator tracks progress and retries failures, with an audit record that deletion happened (without retaining the deleted data).
- **Delete vs anonymise:** for analytics and aggregate records (orders statistics), replace identifiers with irreversible anonymised values so aggregates stay valid. Beware that pseudonymised data (reversible mapping) is still personal data.
- **Caches and search indexes:** invalidate and remove documents.
- **Third parties:** call processor APIs to delete (email platform, CRM, analytics vendors).
- **Logs:** keep personal data out of logs where possible, and use short retention so logs age out within the response window.
- **Backups:** usually can't edit immutable backups; common approach is to let backups expire on a defined schedule (e.g. 35 days) and ensure that if a backup is restored, deletions are re-applied (keep a deletion ledger of user IDs to re-process after restore). Alternatively, **crypto-shredding**: encrypt each user's data with a per-user key and delete the key, rendering their data unreadable everywhere, including backups.

**Other requirements:**
- **Rectification:** users can correct their data; updates propagate to downstream copies (events).
- **Breach response:** detect and assess breaches quickly; regulators must generally be notified within **72 hours** of becoming aware of a qualifying breach; audit logs and data maps make impact assessment possible.
- **DPIAs** (data protection impact assessments) for high-risk processing; engineers contribute technical details.
- **Access controls:** support staff see only what they need, with masked fields and audited access.

**Example deletion event flow:**
```
DELETE request verified
  → privacy-service creates job #831 (deadline: 30 days)
  → publishes user.deletion_requested {user_id: u_42, job: 831}
      orders-service: anonymise orders (keep invoice data for tax, restricted)
      profile-service: delete profile, avatar in object storage
      search-service: remove documents
      analytics: replace user_id with anonymised token, delete raw events
      email-provider adapter: delete contact via API
  → each service reports done; job complete; audit log entry
```"

#### Another worked example: finding personal data everywhere
"When a company received its first erasure requests, engineers found user emails in 14 places, including debug logs retained for a year, a forgotten Elasticsearch index, CSV exports in a shared bucket, and a third-party support tool. We built a data map, tagged PII columns, reduced log retention to 30 days with PII scrubbing, deleted the stale exports, and implemented the event-based deletion workflow. Requests then completed automatically within 48 hours."

#### A third worked example: crypto-shredding for event stores
"An event-sourced system kept an immutable event log in Kafka with long retention, making deletion hard. We encrypted personal fields in each event with a per-user data key stored in a key service. On erasure, we deleted the user's key; old events remained but their personal fields became unreadable, and projections rebuilt without them."

#### Variations you might be asked
- "What's the difference between anonymisation and pseudonymisation?": anonymised data can't be linked back to a person (outside GDPR scope); pseudonymised data can be re-identified with additional information (still personal data).
- "How do you handle consent?": store consent records (purpose, timestamp, version, source), make withdrawal easy, and check consent before processing for that purpose.
- "Does GDPR apply to non-EU companies?": generally yes, if they offer services to or monitor people in the EU.

#### Step-by-step framework
1. **Clarify** you'll work with legal; explain key principles.
2. **Privacy by design**: minimisation, purpose, retention, security.
3. **Data inventory** and classification.
4. **Export workflow** with identity verification.
5. **Deletion orchestration** across systems, backups and third parties.
6. **Breach response and access controls.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Delete the user row" | Deletion across all systems and third parties |
| No data inventory | Data map and PII tagging |
| Logs full of personal data | Minimisation, scrubbing, short retention |
| Ignores backups | Expiry + deletion ledger, or crypto-shredding |
| Gives legal opinions | Works with privacy/legal teams |

#### Useful phrases
- "We can't delete what we can't find, so the data map comes first."
- "Each service owns exporting and deleting its own data."
- "Pseudonymised data is still personal data."
- "Crypto-shredding makes data unreadable even in backups."

#### Common pitfalls
- **Forgotten copies** (exports, logs, search indexes).
- **No identity verification** for requests.
- **Deleting data needed for legal obligations.**
- **Treating hashed emails as anonymous.**

#### Follow-ups to expect (with sample answers)
- **"How long can we keep logs with IP addresses?"**
  "As long as justified by purpose (e.g. security), documented in retention policy; often 30–90 days with access controls."
- **"How do you test deletion works?"**
  "Automated tests creating a user with data in every system, running deletion, and asserting nothing remains; periodic audits."
- **"What happens if a service is down during deletion?"**
  "The orchestrator retries until it confirms completion, alerting if the deadline approaches."

#### What senior interviewers look for
- **Privacy-by-design thinking.**
- **System-wide data awareness.**
- **Pragmatic, auditable workflows.**

#### Practise it
1. Draw a data map for a product you know: where personal data lives.
2. Design a deletion orchestration with events and status tracking.
3. Explain anonymisation vs pseudonymisation, out loud.
