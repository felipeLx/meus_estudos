# US Health Insurance Data + Live Data Quiz

Domain vocabulary and streaming design for the N-iX round 3 client (US medical insurance, live data).

---

## Questions

**1.** In US health insurance, the **payer** is:
- A) The hospital or clinic that renders care
- B) The insurance company that collects premiums and pays claims
- C) The clearinghouse that routes claims
- D) The insured member

**2.** The EDI X12 transaction set that carries a **claim submission** is:
- A) 835
- B) 834
- C) 837
- D) 271

**3.** The **835** transaction carries:
- A) Remittance advice — what was paid, denied or adjusted
- B) A new claim
- C) Member enrollment changes
- D) A prior-authorisation request

**4.** Members joining, leaving or changing plans arrive on:
- A) 837
- B) 834
- C) 270
- D) 278

**5.** A real-time "is this member covered today?" check is:
- A) 276 / 277
- B) 270 / 271
- C) 820
- D) 837I

**6.** 276 / 277 is used for:
- A) Claim status inquiry and response
- B) Eligibility
- C) Premium payment
- D) Enrollment

**7.** A **clearinghouse** sits between:
- A) Two payers settling coordination of benefits
- B) Providers and payers, validating and routing claims
- C) The payer and CMS
- D) The member and the pharmacy

**8.** EDI X12 files are physically:
- A) JSON documents
- B) Parquet files
- C) Segment-delimited hierarchical text with ISA/GS/ST envelopes and loops
- D) Fixed-schema CSV

**9.** **FHIR** differs from X12 in that it is:
- A) A REST/JSON resource model (Patient, Coverage, Claim, ExplanationOfBenefit)
- B) A binary columnar format
- C) A pharmacy-only standard
- D) An older pipe-delimited format

**10.** **HL7 v2** is typically:
- A) A payer billing format
- B) Pipe-delimited clinical messaging between health systems
- C) A drug pricing standard
- D) The same thing as FHIR

**11.** **ICD-10-CM** codes represent:
- A) Diagnoses
- B) Outpatient procedures
- C) Drugs
- D) Provider specialties

**12.** **CPT / HCPCS** codes represent:
- A) Diagnoses
- B) Procedures and services
- C) Inpatient stay pricing groups
- D) Places of service

**13.** **NDC** codes identify:
- A) Providers
- B) Drugs
- C) Diagnoses
- D) Plans

**14.** A **DRG** is used to:
- A) Group inpatient stays for pricing
- B) Identify a provider
- C) Encode a denial reason
- D) Track eligibility spans

**15.** **NPI** identifies:
- A) The provider
- B) The member
- C) The plan
- D) The claim

**16.** **CARC / RARC** codes on the 835 tell you:
- A) Why a claim line was adjusted or denied
- B) The diagnosis
- C) The member's plan tier
- D) The submission date

**17.** Code sets like ICD-10 change yearly, so in the warehouse they should be:
- A) Overwritten each January
- B) Versioned dimensions with effective dates, so a claim is read with the code set valid on its service date
- C) Hard-coded in the transformation
- D) Stored only in the source system

**18.** **PHI** means health data combined with:
- A) Any of the 18 HIPAA identifiers (name, member id, dates finer than year, address below state level …)
- B) Financial data only
- C) Only the name and SSN
- D) Anything stored in a lake

**19.** HIPAA's **minimum necessary** principle implies, technically:
- A) Compress the data
- B) Column- and row-level access so each role and pipeline sees only the fields it needs
- C) Keep only one copy of the data
- D) Delete data after 30 days

**20.** **Safe Harbor de-identification** means:
- A) Encrypting the table
- B) Removing all 18 identifiers so the data is no longer PHI
- C) Storing data in a separate AWS account
- D) Hashing the primary key only

**21.** A **BAA** is:
- A) A business associate agreement — the contract letting a vendor handle PHI
- B) A billing adjustment authorisation
- C) A benefits allocation account
- D) An audit log format

**22.** Safest posture for engineers in non-production:
- A) Read-only production PHI
- B) Masked, tokenised or synthetic data
- C) A subset of real PHI, unmasked
- D) Whatever is fastest to refresh

**23.** Analysts need to join claims to members without holding identity. Best move:
- A) Drop the member id entirely
- B) Tokenise / surrogate-key the member id and keep the mapping in a restricted zone
- C) Hash the name
- D) Give analysts the raw id but audit it

**24.** A claim is **not immutable** because:
- A) Storage is append-only
- B) It gets adjusted, reversed, replaced and resubmitted for months after the service
- C) The clearinghouse rewrites it
- D) ICD-10 changes

**25.** Correct grain for a claims fact table:
- A) One row per member per month
- B) One row per claim header
- C) One row per claim line and version — the level where procedure and money live
- D) One row per provider

**26.** A naive `SUM(paid_amount)` over all claim versions:
- A) Is correct because adjustments net out automatically
- B) Double-counts — you must keep the latest version per line or net the adjustments
- C) Undercounts denials
- D) Only breaks for pharmacy claims

**27.** Deduping claim versions in SQL is idiomatically:
- A) `SELECT DISTINCT *`
- B) `ROW_NUMBER() OVER (PARTITION BY claim_id, line_no ORDER BY version DESC) = 1`
- C) `GROUP BY claim_id`
- D) `LIMIT 1`

**28.** "Claims per month" is ambiguous until you say which date because:
- A) Time zones differ
- B) Service date, received date and paid date differ — the service→received gap is **claim lag**
- C) Months have different lengths
- D) Claims arrive only weekly

**29.** Claim lag is the reason finance holds:
- A) IBNR reserves — incurred but not reported
- B) Deductible accumulators
- C) Premium receivables
- D) Network discounts

**30.** Claim lag is, in data terms:
- A) A schema evolution problem
- B) Late-arriving facts — last month's numbers keep changing after close
- C) A skew problem
- D) A duplicate-key problem

**31.** **Coordination of benefits** creates the risk of:
- A) Missing members
- B) The same service appearing under two plans, so a bad dedup key double-counts
- C) Retired procedure codes
- D) Eligibility gaps

**32.** **PMPM** measures:
- A) Cost per member per month
- B) Claims paid per provider per month
- C) Premium margin per member
- D) Payments per medical procedure

**33.** **MLR** (medical loss ratio) is:
- A) Claims ÷ premium — and it is regulated
- B) Denials ÷ submissions
- C) Paid ÷ billed
- D) Members lost per year

**34.** A paid claim dated outside the member's eligibility span should be:
- A) Ignored — eligibility feeds lag
- B) A hard finding: it means money moved for uncovered care
- C) Silently corrected
- D) Logged as info

**35.** The arithmetic check that must always close on a claim line:
- A) `billed ≥ allowed ≥ paid + member_liability`
- B) `paid = billed`
- C) `allowed = copay + deductible`
- D) `billed = allowed + denied`

**36.** A clearinghouse stops sending files. Which check catches it?
- A) Null checks
- B) Referential integrity
- C) Volume anomaly per feed and trading partner — absence is invisible otherwise
- D) Schema validation

**37.** Duplicate claims most often look like:
- A) Identical claim ids
- B) Same member, provider, service date, procedure and amount under a different claim id
- C) Same amount, different member
- D) Reversals

**38.** Before designing anything for "live data", the first question is:
- A) Which cloud
- B) What latency the business actually acts on, and which feed is live — eligibility, claim status events, or CDC
- C) Kafka or Kinesis
- D) Avro or JSON

**39.** The honest senior argument for micro-batch over true streaming:
- A) Streaming is unreliable
- B) If nobody acts within the minute, micro-batch is cheaper, easier to backfill and easier to test
- C) Streaming cannot do exactly-once
- D) Spark cannot stream

**40.** **Avro** is preferred on streams because:
- A) It is columnar
- B) It is compact row-oriented binary with the schema attached and designed for evolution
- C) It compresses better than Parquet
- D) It supports SQL directly

**41.** **Parquet** is preferred in the analytical layer because:
- A) It is row-oriented
- B) Columnar: column pruning, min/max statistics, strong compression
- C) It carries the schema in a registry
- D) It streams incrementally

**42.** A **schema registry** gives you:
- A) A data catalogue for analysts
- B) Rejection of incompatible schemas at publish time, so producers cannot break consumers silently
- C) Automatic partitioning
- D) Encryption of the payload

**43.** **Backward compatibility** means:
- A) The new schema can read data written with the old one — consumers can upgrade first
- B) The old schema can read new data
- C) Both directions hold
- D) No changes are allowed

**44.** Which change is safe under backward compatibility?
- A) Renaming a required field
- B) Adding an optional field with a default
- C) Removing a required field
- D) Changing a string to an int

**45.** The X12 equivalent of a schema contract is:
- A) The DDL
- B) The implementation guide plus per-partner companion guide
- C) The clearinghouse API
- D) There is none

**46.** In Structured Streaming, a **checkpoint** stores:
- A) A copy of the output
- B) Offsets and state, so a restart resumes instead of reprocessing
- C) The schema
- D) Cluster configuration

**47.** A **watermark** exists to:
- A) Drop duplicates
- B) Bound how long state is kept for late data
- C) Encrypt the stream
- D) Compact small files

**48.** Exactly-once end to end requires:
- A) At-least-once delivery only
- B) An idempotent or transactional sink — delivery guarantees alone are not enough
- C) A single partition
- D) Disabling checkpoints

**49.** The operational cost of streaming into a lake is:
- A) Schema drift
- B) Small files — compaction becomes a scheduled job
- C) Skew
- D) Higher storage class fees

**50.** Landing CDC rows into an Iceberg/Delta table, the correct write is:
- A) `INSERT` everything and dedup in the query layer
- B) `MERGE INTO` on the business key using the latest row per key by operation timestamp
- C) Overwrite the whole table each run
- D) `UPDATE` per row

**51.** A pipeline is **idempotent** when:
- A) It never fails
- B) Re-running the same window produces the same result, not duplicated rows
- C) It runs once a day
- D) It uses transactions

**52.** Member records change plan and address over time. Model as:
- A) SCD1 overwrite
- B) SCD2 with effective/expiry dates, so a claim joins the plan valid at its service date
- C) A separate table per year
- D) A JSON column

**53.** Streaming eligibility (270/271) is characterised by:
- A) High volume, loose latency
- B) Low volume per call, sub-second latency — a request/response lookup, not analytics
- C) Batch nightly
- D) Columnar scans

**54.** Best question to ask about their streaming stack tomorrow:
- A) "Do you use the cloud?"
- B) "Avro with a schema registry or JSON — and how do you manage schema evolution so upstream changes don't break consumers?"
- C) "How many servers?"
- D) "Is it fast?"

**55.** Rows that fail a data-quality rule should generally be:
- A) Dropped silently
- B) Quarantined to a rejects table with the rule that failed, with hard-fail reserved for money- or key-corrupting rules
- C) Written anyway with a flag
- D) Sent back to the provider

## Answer key

1 - B
2 - C
3 - A
4 - B
5 - B
6 - A
7 - B
8 - C
9 - A
10 - B
11 - A
12 - B
13 - B
14 - A
15 - A
16 - A
17 - B
18 - A
19 - B
20 - B
21 - A
22 - B
23 - B
24 - B
25 - C
26 - B
27 - B
28 - B
29 - A
30 - B
31 - B
32 - A
33 - A
34 - B
35 - A
36 - C
37 - B
38 - B
39 - B
40 - B
41 - B
42 - B
43 - A
44 - B
45 - B
46 - B
47 - B
48 - B
49 - B
50 - B
51 - B
52 - B
53 - B
54 - B
55 - B

### One-line rationales

1. **Payer** = the insurer. Provider renders care, clearinghouse routes, member is insured.
2. **837** is the claim (837P professional, 837I institutional, 837D dental).
3. **835** is the remittance: paid, denied, adjusted, with reason codes.
4. **834** is enrollment and maintenance — the member feed.
5. **270** asks eligibility, **271** answers. Latency-critical, low volume per call.
6. **276/277** is claim status inquiry and response.
7. The **clearinghouse** validates and routes between providers and payers.
8. X12 is **segment-delimited hierarchical text** (`ISA/GS/ST`, loops, `~` and `*`) — parsing it is real work.
9. **FHIR** is REST/JSON resources; CMS interoperability rules push payers toward it.
10. **HL7 v2** is pipe-delimited clinical messaging, older and different from FHIR.
11. **ICD-10-CM** = diagnoses; ICD-10-PCS = inpatient procedures.
12. **CPT/HCPCS** = procedures and services.
13. **NDC** = drug codes, the pharmacy side.
14. **DRG** groups inpatient stays for pricing.
15. **NPI** = national provider identifier; taxonomy code gives specialty.
16. **CARC/RARC** are the adjustment/denial reason codes on the 835.
17. Yearly code changes make these **versioned dimensions with effective dates** — SCD2 on reference data.
18. **PHI** = health data plus any of the **18 identifiers**.
19. **Minimum necessary** translates to column- and row-level access control.
20. **Safe Harbor** strips all 18 identifiers; the alternative is expert determination.
21. A **BAA** is the contract that lets a vendor handle PHI — N-iX works under one.
22. Non-production should use **masked, tokenised or synthetic** data.
23. **Tokenise** the member id; keep the mapping in a restricted zone.
24. Claims are **adjusted, reversed and replaced** for months — design for versions.
25. Grain is the **claim line + version**; header level loses the money detail.
26. Summing all versions **double-counts**. Latest-version-per-line or net adjustments.
27. `ROW_NUMBER() … ORDER BY version DESC` filtered to 1 is the standard dedupe.
28. Three date roles: **service, received, paid**. Service→received is **claim lag**.
29. Lag is why **IBNR** reserves exist — finance cares a lot.
30. Claim lag is the domain's **late-arriving facts** problem; closed months keep moving.
31. **Coordination of benefits** duplicates the service across plans — dedup carefully.
32. **PMPM** = cost per member per month, the core cost unit.
33. **MLR** = claims ÷ premium, and it is regulated.
34. A claim outside the eligibility span is a **hard finding**: money moved for uncovered care.
35. `billed ≥ allowed ≥ paid + member_liability` — the arithmetic must close.
36. Only a **volume anomaly check per feed** catches a partner going quiet; absence has no rows.
37. Duplicates hide behind a **different claim id** with identical business attributes.
38. Ask **what latency the business acts on**, and which feed is actually live.
39. If nobody acts within the minute, **micro-batch** is cheaper and far easier to backfill and test.
40. **Avro**: compact row binary, schema attached, built for evolution — the Kafka pairing.
41. **Parquet**: columnar, pruning, statistics, compression — the analytics pairing.
42. The **registry** rejects incompatible schemas at publish time; that is the guarantee.
43. **Backward** = new schema reads old data, so consumers upgrade safely.
44. **Optional field with a default** is the safe evolution; renames and removals are not.
45. In EDI the contract lives in the **implementation and companion guides**.
46. **Checkpoint** = offsets plus state; restart resumes rather than reprocessing.
47. **Watermark** bounds how long late-data state is retained.
48. Exactly-once needs an **idempotent or transactional sink**.
49. Streaming into a lake generates **small files** — compaction is the standing cost.
50. **`MERGE INTO`** on the business key with latest-row-per-key is the CDC landing pattern.
51. **Idempotent** = re-running a window gives the same result, no duplicates.
52. **SCD2** on member so a claim joins the plan valid at its service date.
53. Eligibility is a **low-volume, sub-second request/response** path, not an analytical scan.
54. The **Avro + registry + evolution** question is the one that sounds senior.
55. **Quarantine** with the failing rule; hard-fail only what corrupts money or keys.
