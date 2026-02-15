# Outdated Packages Report - fdm-monster
**Generated:** February 8, 2026

## 🚨 Critical - Extremely Outdated (2+ years old)

### passport-anonymous@1.0.1
- **Current Release Date:** August 2, 2013 (12+ years old!)
- **Latest Version Available:** 1.0.1 (no updates)
- **Status:** Package appears abandoned
- **Recommendation:** Consider removing or finding alternative authentication strategy
- **Risk:** High - Very old package, potential security concerns

### eventemitter2@6.4.9
- **Current Release Date:** September 12, 2022 (3+ years old)
- **Latest Version Available:** 6.4.9 (no updates)
- **Status:** Package appears stagnant
- **Recommendation:** Monitor for updates or consider alternatives
- **Risk:** Medium - Core functionality package

### passport-jwt@4.0.1
- **Current Release Date:** December 24, 2022 (3+ years old)
- **Latest Version Available:** 4.0.1 (no updates)
- **Status:** Package appears stagnant
- **Recommendation:** Monitor for security issues, consider alternatives if vulnerabilities emerge
- **Risk:** Medium-High - Authentication package

### connect-history-api-fallback@2.0.0
- **Current Release Date:** June 27, 2022 (3+ years old)
- **Latest Version Available:** 2.0.0 (no updates)
- **Status:** Package appears stable/complete
- **Recommendation:** Monitor but likely fine for its purpose
- **Risk:** Low - Simple middleware

## ⚠️ Moderate - Outdated (1-2 years old)

### jest@29.7.0
- **Current Release Date:** September 12, 2023 (2+ years old)
- **Latest Version Available:** 30.2.0
- **Status:** Major version behind
- **Recommendation:** Upgrade to Jest 30.x
- **Risk:** Low - Testing framework, but missing features/fixes

### ts-node@10.9.2
- **Current Release Date:** December 8, 2023 (2+ years old)
- **Latest Version Available:** 10.9.2 (no updates)
- **Status:** Package appears complete
- **Recommendation:** Monitor but stable
- **Risk:** Low - Dev dependency

### passport@0.7.0
- **Current Release Date:** November 27, 2023 (2+ years old)
- **Latest Version Available:** 0.7.0 (no updates)
- **Status:** Package appears stable
- **Recommendation:** Monitor for updates
- **Risk:** Medium - Core authentication package

### reflect-metadata@0.2.2
- **Current Release Date:** March 29, 2024 (1+ years old)
- **Latest Version Available:** 0.2.2 (no updates)
- **Status:** Package appears stable/complete
- **Recommendation:** No action needed
- **Risk:** Low - Stable polyfill

### @octokit/plugin-throttling@8.2.0
- **Current Release Date:** February 22, 2024 (nearly 2 years old)
- **Latest Version Available:** 11.0.3 (3 major versions behind!)
- **Status:** Significantly outdated
- **Recommendation:** Upgrade to 11.x - check changelog for breaking changes
- **Risk:** Medium - GitHub API interactions

### prom-client@15.1.3
- **Current Release Date:** June 27, 2024 (1.5 years old)
- **Latest Version Available:** 15.1.3 (no updates)
- **Status:** Package stable
- **Recommendation:** Monitor for updates
- **Risk:** Low - Metrics library

### tsx@4.19.2
- **Current Release Date:** October 26, 2024 (1+ years old)
- **Latest Version Available:** 4.21.0
- **Status:** Minor version behind
- **Recommendation:** Update to 4.21.0
- **Risk:** Very Low - Dev dependency

### winston-loki@6.1.3
- **Current Release Date:** October 15, 2024 (1+ years old)
- **Latest Version Available:** 6.1.3 (no updates)
- **Status:** Package stable
- **Recommendation:** Monitor for updates
- **Risk:** Low - Logging transport

### awilix-express@9.0.2
- **Current Release Date:** December 21, 2024 (1+ years old)
- **Latest Version Available:** 9.0.2 (no updates)
- **Status:** Relatively recent
- **Recommendation:** No action needed
- **Risk:** Very Low

## ✅ Recently Updated (< 1 year old)

The following packages are up-to-date (all released in 2025-2026):

### Production Dependencies
- @fdm-monster/client-next@2.3.3 (Feb 1, 2026)
- @sentry/node@10.38.0 (Jan 29, 2026)
- adm-zip@0.5.16 (Aug 30, 2024) - Nearly 1.5 years but still recent
- awilix@12.0.5 (Mar 14, 2025)
- axios@1.13.4 (Jan 27, 2026)
- basic-ftp@5.1.0 (Dec 27, 2025)
- bcryptjs@3.0.3 (Nov 2, 2025)
- better-sqlite3@12.6.2 (Jan 17, 2026)
- class-validator@0.14.3 (Nov 24, 2025)
- cookie-parser@1.4.7 (Oct 8, 2024) - Over 1 year but acceptable
- cors@2.8.6 (Jan 22, 2026)
- cross-env@10.1.0 (Sep 29, 2025)
- dotenv@17.2.4 (Feb 5, 2026)
- express@4.22.1 (Dec 1, 2025)
- form-data@4.0.5 (Nov 17, 2025)
- helmet@8.1.0 (Mar 17, 2025)
- js-yaml@4.1.1 (Nov 12, 2025)
- jsonwebtoken@9.0.3 (Dec 4, 2025)
- lodash@4.17.23 (Jan 21, 2026)
- luxon@3.7.2 (Sep 5, 2025)
- mqtt@5.15.0 (Feb 2, 2026)
- multer@2.0.2 (Jul 17, 2025)
- octokit@3.2.2 (May 20, 2025)
- semver@7.7.4 (Feb 5, 2026)
- socket.io@4.8.3 (Dec 23, 2025)
- toad-scheduler@3.1.0 (May 5, 2025)
- typeorm@0.3.28 (Dec 3, 2025)
- uuid@11.1.0 (Feb 19, 2025)
- winston@3.19.0 (Dec 7, 2025)
- ws@8.19.0 (Jan 5, 2026)
- zod@3.25.76 (Jul 8, 2025)

### Dev Dependencies
- @biomejs/biome@2.3.14 (Feb 3, 2026)
- @swc/cli@0.8.0 (Feb 6, 2026)
- @swc/core@1.15.11 (Jan 27, 2026)
- typescript@5.9.3 (Sep 30, 2025)

## 📋 Action Items Summary

### High Priority
1. **Remove or replace `passport-anonymous`** - 12+ years old, likely security risk
2. **Upgrade `@octokit/plugin-throttling`** from 8.2.0 to 11.0.3 (3 major versions behind)
3. **Upgrade `jest`** from 29.7.0 to 30.2.0

### Medium Priority
4. Review `passport-jwt@4.0.1` and `eventemitter2@6.4.9` for known vulnerabilities
5. Consider alternatives for stagnant authentication packages
6. Update `tsx` from 4.19.2 to 4.21.0

### Low Priority
7. Monitor all packages marked as "stable" for security advisories
8. Review `connect-history-api-fallback` usage and consider if still needed

## 🔍 Security Audit Recommendation

Run a security audit to check for CVEs in the outdated packages:
```bash
yarn audit
npm audit
```

## 📊 Statistics

- **Total Dependencies Analyzed:** 42 production + 6 key dev dependencies
- **Critically Outdated (2+ years):** 4 packages
- **Moderately Outdated (1-2 years):** 9 packages
- **Recently Updated (< 1 year):** 35+ packages
- **Packages with No Updates Available:** 8 packages (potentially abandoned or complete)

---
*Report generated by analyzing npm registry data on February 8, 2026*

