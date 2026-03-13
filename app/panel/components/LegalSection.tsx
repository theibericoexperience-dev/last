'use client';

import { useState } from 'react';
import { ShieldCheckIcon, LockClosedIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type Tab = 'guarantee' | 'privacy';

export default function LegalSection() {
  const [activeTab, setActiveTab] = useState<Tab>('guarantee');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheckIcon className="h-6 w-6 text-slate-400" />
        <h2 className="text-2xl font-light text-slate-900">Legal Information</h2>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('guarantee')}
          className={`flex-1 pb-2 pt-1 text-sm font-semibold transition-colors ${
            activeTab === 'guarantee'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Ibero Guarantee
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 pb-2 pt-1 text-sm font-semibold transition-colors ${
            activeTab === 'privacy'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Privacy Policy
        </button>
      </div>

      {/* Content */}
      {activeTab === 'guarantee' ? <GuaranteeContent /> : <PrivacyContent />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Ibero Guarantee
   ═══════════════════════════════════════════ */
function GuaranteeContent() {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white">
        <ShieldCheckIcon className="h-8 w-8 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold leading-snug">The Ibero Guarantee</h3>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Uncompromising security and peace of mind for your journey. As a fully registered and certified European travel agency, Ibero operates under the strict legal framework of the European Union — providing some of the most rigorous consumer protection laws in the world.
        </p>
      </div>

      <Accordion title="1. European Package Travel Directive">
        <p>As a registered agency in Europe, we strictly comply with the <strong>European Package Travel Directive (Directive (EU) 2015/2302)</strong>. This directive mandates that travel agencies take full responsibility for the proper performance of all travel services included in the package, regardless of whether those services are provided by the agency itself or by third-party suppliers.</p>
        <p className="mt-2">If any part of your trip does not meet the agreed-upon standards, our agency is legally bound to resolve the issue, providing you with a single, reliable point of contact and accountability.</p>
      </Accordion>

      <Accordion title="2. €100,000 Surety Bond Guarantee">
        <p>We maintain a legally binding <strong>Surety Bond (Aval de Caución)</strong> valued at €100,000. This financial guarantee ensures:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Protection of Prepayments</strong> — In the event of insolvency, your payments are 100% protected.</li>
          <li><strong>Guaranteed Repatriation</strong> — If insolvency occurs while you are traveling, all return expenses are fully covered.</li>
          <li><strong>Trust & Stability</strong> — A €100,000 bond requires rigorous financial auditing, proving Ibero is a financially healthy and trustworthy organization.</li>
        </ul>
      </Accordion>

      <Accordion title="3. €300,000 Civil Liability Insurance">
        <p>Ibero carries a <strong>Comprehensive Civil Liability Insurance</strong> policy with coverage up to €300,000, including:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Bodily Injury & Property Damage</strong> — Coverage for accidental harm or damage caused by negligence during our services.</li>
          <li><strong>Professional Indemnity</strong> — Protection against errors or omissions in organizing your travel.</li>
          <li><strong>Third-Party Liability</strong> — If a contracted supplier fails, our insurance acts as a safety net up to the €300,000 limit.</li>
        </ul>
      </Accordion>

      <Accordion title="4. GDPR Data Protection">
        <p>Your privacy is a fundamental right. Ibero guarantees the security of your personal information in strict compliance with <strong>Regulation (EU) 2016/679 (GDPR)</strong>:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Lawfulness, Fairness & Transparency</strong> — Data collected solely for travel organization and processed transparently.</li>
          <li><strong>Data Minimization</strong> — We only request information necessary to execute your travel contract.</li>
          <li><strong>Integrity & Confidentiality</strong> — Advanced encryption and secure servers protect against unauthorized access.</li>
          <li><strong>Your Rights</strong> — Access, rectify, or erase your personal data at any time.</li>
        </ul>
      </Accordion>

      {/* Agency Details */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-1 text-sm text-slate-600">
        <p className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Certified Agency Details</p>
        <p><strong>Agency:</strong> Ibero</p>
        <p><strong>CIEX Code:</strong> 06-00049-Om</p>
        <p><strong>Registration:</strong> AV-00661</p>
        <p><strong>Email:</strong> tours@ibero.world</p>
        <p><strong>Website:</strong> www.ibero.world</p>
        <p className="mt-3 text-xs text-slate-500 italic">Travel with confidence. Travel with security. Travel with Ibero.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Privacy Policy
   ═══════════════════════════════════════════ */
function PrivacyContent() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-900 p-6 text-white">
        <LockClosedIcon className="h-8 w-8 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold leading-snug">Privacy Policy & Data Protection</h3>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Last updated: March 5, 2026. At Ibero, we are committed to protecting your privacy in full compliance with Regulation (EU) 2016/679 (GDPR).
        </p>
      </div>

      <Accordion title="1. Data Controller">
        <p><strong>Agency:</strong> Ibero · <strong>CIEX:</strong> 06-00049-Om · <strong>REG:</strong> AV-00661</p>
        <p><strong>Email:</strong> tours@ibero.world · <strong>Website:</strong> www.ibero.world</p>
      </Accordion>

      <Accordion title="2. Information We Collect">
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Identification Data:</strong> Full name, date of birth, gender, nationality.</li>
          <li><strong>Contact Information:</strong> Email, phone number, physical address.</li>
          <li><strong>Travel Documentation:</strong> Passport or ID card details.</li>
          <li><strong>Financial Data:</strong> Payment details and billing information.</li>
          <li><strong>Special Requirements:</strong> Health data or dietary requirements, provided voluntarily.</li>
        </ul>
      </Accordion>

      <Accordion title="3. Purpose of Data Processing">
        <p>According to Article 6 of the GDPR, we process your data based on:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Contractual Necessity:</strong> Managing bookings, issuing tickets, coordinating with providers.</li>
          <li><strong>Legal Obligation:</strong> Tax laws, security regulations, traveler registration.</li>
          <li><strong>Consent:</strong> Newsletters or promotional offers (opt-in only).</li>
          <li><strong>Vital Interests:</strong> Emergency health or safety situations during a trip.</li>
        </ul>
      </Accordion>

      <Accordion title="4. Data Retention">
        <p>We retain personal data only as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, or reporting requirements. Data is generally kept for the duration of the legal statute of limitations following the completion of your journey.</p>
      </Accordion>

      <Accordion title="5. Data Security">
        <p>In compliance with Article 32 of the GDPR, Ibero implements rigorous technical and organizational measures including encryption of sensitive data, secure servers with restricted access, and regular audits of our processing practices.</p>
      </Accordion>

      <Accordion title="6. Sharing Data with Third Parties">
        <p>To execute your travel contract, relevant data is shared with third-party providers (airlines, hotels, local operators).</p>
        <p className="mt-1"><strong>International Transfers:</strong> If your destination is outside the EEA, appropriate safeguards are in place.</p>
        <p className="mt-1"><strong>No Commercial Sale:</strong> We never sell or lease your personal data for marketing purposes.</p>
      </Accordion>

      <Accordion title="7. Your Legal Rights">
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Right of Access:</strong> Request a copy of data we hold.</li>
          <li><strong>Right to Rectification:</strong> Correct inaccurate data.</li>
          <li><strong>Right to Erasure:</strong> Request deletion when no longer necessary.</li>
          <li><strong>Right to Restrict Processing:</strong> Limit how we use your data.</li>
          <li><strong>Right to Data Portability:</strong> Receive data in a structured format.</li>
          <li><strong>Right to Object:</strong> Object to processing for direct marketing.</li>
        </ul>
        <p className="mt-2">To exercise any right, contact us at <strong>tours@ibero.world</strong>.</p>
      </Accordion>

      <Accordion title="8. Consent">
        <p>By using our services and providing your information, you acknowledge that you have read and understood this Privacy Policy. Where specific consent is required (e.g., sensitive health data), we will request it explicitly.</p>
      </Accordion>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Reusable Accordion
   ═══════════════════════════════════════════ */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
