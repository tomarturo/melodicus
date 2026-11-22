import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { EnvelopeSimple } from '@phosphor-icons/react';
import Callout from './components/Callout';
import { useAuth } from './contexts/AuthContext';
import { errorCause } from './lib/errors';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// The same filled, rounded field as the loop name dialog.
const fieldStyle = {
  rounded: 'full',
  variant: 'filled',
  bg: 'bg.muted',
  _hover: { bg: 'bg.mutedHover' },
  _focus: { bg: 'bg.muted', borderColor: 'border.focus' },
  _placeholder: { opacity: 1, color: 'fg.placeholder' },
} as const;

// The secondary actions under the main button: underlined text links.
const linkButtonStyle = {
  variant: 'link',
  size: 'sm',
  color: 'fg.strong',
  fontWeight: 'semibold',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
} as const;

// Supabase sends at most one code a minute to an address.
const RESEND_AFTER_S = 60;

/**
 * The address login codes come from: Supabase's SMTP sender. Shown to people
 * who can't find the email, so keep it in step with supabase/templates/README.md.
 */
export const LOGIN_EMAIL_FROM = 'account@melodicus.xyz';

// Codes are 6 digits by default; Supabase allows up to 10.
const CODE_PATTERN = /^\d{6,10}$/;

/**
 * Logging in and signing up are the same: an email, then the code sent to it.
 * New addresses get an account on the way.
 */
const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Seconds until another code can be sent.
  const [resendIn, setResendIn] = useState(0);

  // Each time it opens, start from the email; what was typed stays.
  useEffect(() => {
    if (!isOpen) return;
    setStep('email');
    setCode('');
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const send = async () => {
    setLoading(true);
    setError(null);
    const result = await sendCode(email.trim());
    setLoading(false);
    if (result.error) {
      setError(`Couldn’t send a code. ${errorCause(result.error)}`);
      return;
    }
    setCode('');
    setStep('code');
    setResendIn(RESEND_AFTER_S);
  };

  const verify = async () => {
    if (!CODE_PATTERN.test(code)) {
      setError('Enter the code from the email, digits only.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await verifyCode(email.trim(), code);
    setLoading(false);
    if (result.error) {
      setError('That code didn’t work. Check it, or send a new one: codes expire after an hour.');
      return;
    }
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void (step === 'email' ? send() : verify());
  };

  const changeEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit} noValidate={false}>
        <ModalHeader pb={1}>{step === 'email' ? 'Log in or sign up' : 'Check your email'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="fg.muted" mb={5}>
            {step === 'email' ? (
              'Enter your email and we’ll send you a code. No password needed. New here? The code creates your account.'
            ) : (
              <>
                We sent a code to{' '}
                <Text as="span" fontWeight="semibold" color="fg.strong">
                  {email.trim()}
                </Text>
                . Enter it here to log in.
              </>
            )}
          </Text>
          <Stack spacing={4}>
            {step === 'email' ? (
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="fg.default" requiredIndicator={<></>}>
                  Email
                </FormLabel>
                <Input
                  {...fieldStyle}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </FormControl>
            ) : (
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="fg.default" requiredIndicator={<></>}>
                  Code
                </FormLabel>
                <Input
                  {...fieldStyle}
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={10}
                  letterSpacing="0.2em"
                  fontWeight="semibold"
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                  value={code}
                  // Pasted codes can arrive with spaces; keep the digits.
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                />
              </FormControl>
            )}
            {step === 'code' && (
              <Callout icon={EnvelopeSimple}>
                Not in your inbox? Check your spam folder or search for{' '}
                <Text as="span" fontWeight="semibold">
                  {LOGIN_EMAIL_FROM}
                </Text>
              </Callout>
            )}
            {error && (
              <Text role="alert" fontSize="sm" color="red.700">
                {error}
              </Text>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter flexDirection="column" gap={4} pt={6}>
          <Button
            type="submit"
            variant="loud"
            w="100%"
            isLoading={loading}
            loadingText={step === 'email' ? 'Sending code' : 'Logging in'}
          >
            {step === 'email' ? 'Email me a code' : 'Log in'}
          </Button>
          {step === 'code' && (
            <Stack direction="row" spacing={5} fontSize="sm">
              <Button {...linkButtonStyle} isDisabled={resendIn > 0 || loading} onClick={() => void send()}>
                {resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
              </Button>
              <Button {...linkButtonStyle} isDisabled={loading} onClick={changeEmail}>
                Use a different email
              </Button>
            </Stack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
