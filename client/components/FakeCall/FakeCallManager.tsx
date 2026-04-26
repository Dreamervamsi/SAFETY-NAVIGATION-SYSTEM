import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Modal } from 'react-native';
import IncomingCallUI from './IncomingCallUI';
import ActiveCallUI from './ActiveCallUI';

export interface FakeCallManagerHandle {
  triggerCall: (name?: string) => void;
}

interface FakeCallManagerProps {
  backendUrl: string;
}

const FakeCallManager = forwardRef<FakeCallManagerHandle, FakeCallManagerProps>(({ backendUrl }, ref) => {
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'active'>('idle');
  const [callerName, setCallerName] = useState('Dad');

  useImperativeHandle(ref, () => ({
    triggerCall: (name = 'Dad') => {
      setCallerName(name);
      setCallState('incoming');
    },
  }));

  const handleAccept = () => {
    setCallState('active');
  };

  const handleDecline = () => {
    setCallState('idle');
  };

  const handleEndCall = () => {
    setCallState('idle');
  };

  if (callState === 'idle') return null;

  return (
    <Modal visible={callState !== 'idle'} animationType="fade" transparent={true}>
      {callState === 'incoming' ? (
        <IncomingCallUI 
          callerName={callerName} 
          onAccept={handleAccept} 
          onDecline={handleDecline} 
        />
      ) : (
        <ActiveCallUI 
          callerName={callerName} 
          onEndCall={handleEndCall} 
          backendUrl={backendUrl}
        />
      )}
    </Modal>
  );
});

export default FakeCallManager;
