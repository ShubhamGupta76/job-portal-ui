import { useCallback, useMemo, useState } from 'react';

export const ASSESSMENT_LIFECYCLE = {
  IDLE: 'IDLE',
  VERIFYING: 'VERIFYING',
  REQUESTING_PERMISSIONS: 'REQUESTING_PERMISSIONS',
  ENTERING_FULLSCREEN: 'ENTERING_FULLSCREEN',
  INITIALIZING: 'INITIALIZING',
  ACTIVE: 'ACTIVE',
  SUBMITTING: 'SUBMITTING',
  COMPLETED: 'COMPLETED',
};

export const useAssessmentLifecycle = () => {
  const [state, setState] = useState(ASSESSMENT_LIFECYCLE.IDLE);

  const transitionTo = useCallback((nextState, details = {}) => {
    setState((previousState) => {
      console.debug('[AssessmentLifecycle]', {
        from: previousState,
        to: nextState,
        ...details,
      });
      return nextState;
    });
  }, []);

  const flags = useMemo(() => ({
    isInitializing: [
      ASSESSMENT_LIFECYCLE.VERIFYING,
      ASSESSMENT_LIFECYCLE.REQUESTING_PERMISSIONS,
      ASSESSMENT_LIFECYCLE.ENTERING_FULLSCREEN,
      ASSESSMENT_LIFECYCLE.INITIALIZING,
    ].includes(state),
    assessmentReady: state === ASSESSMENT_LIFECYCLE.ACTIVE,
    securityEnabled: state === ASSESSMENT_LIFECYCLE.ACTIVE,
  }), [state]);

  return {
    lifecycleState: state,
    transitionTo,
    ...flags,
  };
};
