import React from 'react';

interface PriceSummaryProps {
  basePricePerTraveler: number;
  travelers: number;
  roomSupplement: number;
  addonsTotal: number;
  depositDue: number;
  depositDate: string;
  register: any;
  setValue: (name: string, value: any, opts?: any) => void;
  setOptionalsOpen: (v: boolean) => void;
  handleSubmit: any;
  onSubmit: any;
  isValid: boolean;
  isSubmitting: boolean;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  setTermsModalOpen: (v: boolean) => void;
  router: any;
  onOpenRegister?: () => void;
  showAuthPrompt?: boolean;
  isAuthenticated?: boolean | null;
}

export default function PriceSummary(props: PriceSummaryProps) {
  const {
    basePricePerTraveler,
    travelers,
    roomSupplement,
    addonsTotal,
    depositDue,
    depositDate,
    register,
    setValue,
    setOptionalsOpen,
    handleSubmit,
    onSubmit,
    isValid,
    isSubmitting,
    termsAccepted,
    setTermsAccepted,
    setTermsModalOpen,
    router,
    onOpenRegister,
    showAuthPrompt,
    isAuthenticated,
  } = props;

  const isAuthReady = isAuthenticated !== null && isAuthenticated !== undefined;
  const isAuthed = isAuthenticated === true;
  // readiness for submission (auth gating is handled by the guarded submit handler)
  const isReady = isValid && !isSubmitting && termsAccepted;
  // showLogin is true when parent explicitly requests auth prompt, or when auth state is not true
  const showLogin = Boolean(showAuthPrompt ?? (isAuthenticated !== true));
    const handleGuardedSubmit = async () => {
      // Debug: log auth gating values to diagnose issues reported by QA
      try {
        // eslint-disable-next-line no-console
        console.debug('[PriceSummary] handleGuardedSubmit:', { showAuthPrompt, showLogin, isAuthenticated });
      } catch (e) {}

      // If parent explicitly asked us to show the auth prompt, or auth state indicates not authed,
      // open the register modal immediately and never call the submit handler.
      if (showAuthPrompt === true || showLogin || isAuthenticated !== true) {
        // eslint-disable-next-line no-console
        console.debug('[PriceSummary] Opening register modal from guarded submit');
        if (typeof onOpenRegister === 'function') onOpenRegister();
        return;
      }
      return handleSubmit(onSubmit)();
    };

  return (
    <div className="basis-1/2 shrink min-w-0 space-y-4 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="p-4 rounded-lg border bg-white flex flex-col h-full min-h-0 overflow-hidden min-w-0">
        <div className="w-full flex-1 flex flex-col h-full min-h-0 overflow-auto min-w-0">
          <div className="mt-0 p-3 bg-gray-50 rounded min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium text-gray-900">Price summary</h4>
              <div className="flex items-center gap-4">
                <div className="font-medium">${basePricePerTraveler.toLocaleString()}</div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 mr-1">Travelers</label>
                  <div className="inline-flex items-center border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, travelers - 1);
                        setValue('travelers', next, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="px-2 py-1 text-sm bg-white hover:bg-gray-100"
                    >-
                    </button>
                    <div className="px-3 py-1 text-sm">{travelers}</div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = travelers + 1;
                        setValue('travelers', next, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="px-2 py-1 text-sm bg-white hover:bg-gray-100"
                    >+
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-700 space-y-2">
              {roomSupplement > 0 && (
                <div className="flex justify-between">
                  <div>Single-traveler surcharge</div>
                  <div className="font-medium">${roomSupplement.toLocaleString()}</div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setOptionalsOpen(true)}
                    className="text-emerald-600 font-semibold text-sm hover:underline"
                    aria-haspopup="dialog"
                    aria-controls="optionals-modal"
                  >
                    Add‑ons
                  </button>
                  <div className="font-medium">${addonsTotal.toLocaleString()}</div>
                </div>
              </div>

              <hr className="my-2" />
              <div className="flex flex-col items-stretch">
                <div className="flex justify-between items-baseline">
                  <div className="text-sm text-gray-600">Deposit</div>
                  <div className="text-2xl font-semibold">${depositDue.toLocaleString()}</div>
                </div>
                <div className="mt-1 text-xs text-gray-500 flex flex-col gap-1">
                    <div className="flex justify-between">
                      <div>Due by {depositDate}</div>
                      <div>Total: ${ (basePricePerTraveler * travelers + roomSupplement + addonsTotal).toLocaleString()}</div>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <div>Estimated cashback (5%)</div>
                      <div>${((basePricePerTraveler * travelers + roomSupplement + addonsTotal) * 0.05).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-700 space-y-2 mt-auto">
            <div className="mt-3 text-sm">
              <div className="mt-1">
                <label className="text-xs text-gray-500">Comments</label>
                <textarea {...register('comments')} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Add any notes or requests (optional)" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                <span>I have read and agree to the </span>
                <button type="button" onClick={() => setTermsModalOpen(true)} className="underline text-sm text-gray-700">terms &amp; conditions</button>
              </label>
            </div>

            {(showAuthPrompt === true || showLogin || isAuthenticated !== true) && (
              <div className="mt-2 mb-4 text-center text-sm font-semibold text-slate-700">
                You need to be registered to book a tour.
                <button
                  type="button"
                  onClick={() => { if (typeof onOpenRegister === 'function') onOpenRegister(); }}
                  className="ml-2 text-emerald-700 underline underline-offset-2"
                >
                  Create account / Login
                </button>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={handleGuardedSubmit}
                // if user is authenticated, require readiness; if not authenticated, allow click to open register modal
                disabled={isAuthenticated === true ? !isReady : false}
                className="px-8 py-3 bg-emerald-600 text-white text-lg rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Confirming...' : 'Submit reservation'}
              </button>
            </div>

            <div className="mt-3 text-sm text-gray-600 space-y-2 text-center">
              <div className="truncate w-full">After submitting, you will be redirected to the Dashboard, where you can finalize the last booking procedures.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
