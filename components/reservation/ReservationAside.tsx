import React from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ReservationAsideProps {
  tourData: any;
  rightPanelOpen: 'included' | 'important' | 'help' | null;
  setRightPanelOpen: (v: 'included' | 'important' | 'help' | null) => void;
  setOptionalsOpen: (v: boolean) => void;
  setNeedHelpModalOpen: (v: boolean) => void;
}

export default function ReservationAside(props: ReservationAsideProps) {
  const { tourData, rightPanelOpen, setRightPanelOpen, setOptionalsOpen, setNeedHelpModalOpen } = props;

  return (
    <div className="basis-1/2 shrink min-w-0 space-y-4 flex flex-col h-full min-h-0 overflow-hidden">
  <div className="flex-1 flex flex-col space-y-4 overflow-auto min-h-0 min-w-0 h-full">
        {/* What's included - collapsible */}
        <div className="rounded-lg border bg-white min-w-0">
          <button
            type="button"
            onClick={() => setRightPanelOpen(rightPanelOpen === 'included' ? null : 'included')}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">What&apos;s included</h3>
            {rightPanelOpen === 'included' ? <ChevronUpIcon className="w-5 h-5 text-gray-600" /> : <ChevronDownIcon className="w-5 h-5 text-gray-600" />}
          </button>
          {rightPanelOpen === 'included' && (
            <div className="px-4 pb-4 pt-0 text-sm text-gray-700">
              <ul className="grid grid-cols-1 gap-2">
                {Array.isArray(tourData.inclusions) && tourData.inclusions.filter((inc: string) => !/flight/i.test(inc)).map((inc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-1" />
                    <span>{inc}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-green-500 mt-1" />
                  <div>24h support during the trip</div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-green-500 mt-1" />
                  <div className="font-medium">Flights from New York, Boston &amp; Toronto</div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Optionals button - not collapsible */}
        <div>
          <button type="button" onClick={() => setOptionalsOpen(true)} className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium">View optionals & add-ons</button>
        </div>

        {/* Important information - collapsible */}
        <div className="rounded-lg border bg-white min-w-0">
          <button
            type="button"
            onClick={() => setRightPanelOpen(rightPanelOpen === 'important' ? null : 'important')}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">Important information</h3>
            {rightPanelOpen === 'important' ? <ChevronUpIcon className="w-5 h-5 text-gray-600" /> : <ChevronDownIcon className="w-5 h-5 text-gray-600" />}
          </button>
          {rightPanelOpen === 'important' && (
            <div className="px-4 pb-4 pt-0 text-sm text-gray-700 overflow-auto max-h-48">
              <p className="whitespace-pre-wrap">{tourData.disclaimer}</p>
              <p>
                Ibero guarantees an unforgettable trip, crafted with your experience at the core. The purpose of our tours is to help you discover &amp; connect with other people &amp; places of our world, promoting a type of tourism that tries to benefit all the agents involved.
              </p>
              <ul className="mt-2 space-y-1">
                <li>Prices are indicative and may fluctuate with exchange rates.</li>
                <li>Flights and accommodations are subject to availability at time of booking.</li>
                <li>Substitutions for itinerary components may occur; equal or higher value guaranteed.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Need help - collapsible */}
        <div className="rounded-lg border bg-white min-w-0">
          <button
            type="button"
            onClick={() => setRightPanelOpen(rightPanelOpen === 'help' ? null : 'help')}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">Need help?</h3>
            {rightPanelOpen === 'help' ? <ChevronUpIcon className="w-5 h-5 text-gray-600" /> : <ChevronDownIcon className="w-5 h-5 text-gray-600" />}
          </button>
          {rightPanelOpen === 'help' && (
            <div className="px-4 pb-4 pt-0 text-sm text-gray-700">
              <p>If you need assistance, open a support ticket and our team will follow up. Tickets can be managed from your dashboard.</p>
              <div className="mt-3">
                <button onClick={() => setNeedHelpModalOpen(true)} className="px-3 py-2 bg-emerald-600 text-white rounded">Open support ticket</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
