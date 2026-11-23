import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PinInput,
  PinInputField,
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
export const LOGIN_EMAIL_FROM = 'login@melodicus.xyz';

/**
 * Digits in a login code: one box each. Must match Supabase's Authentication
 * → Providers → Email → Email OTP Length (see supabase/templates/README.md);
 * if that changes, change this with it.
 */
export const LOGIN_CODE_LENGTH = 6;
const CODE_PATTERN = new RegExp(`^\\d{${LOGIN_CODE_LENGTH}}$`);
const CODE_BOXES = Array.from({ length: LOGIN_CODE_LENGTH }, (_, index) => index);

// Each digit's box: the filled look of the app's fields, squared off.
const codeBoxStyle = {
  bg: 'bg.muted',
  borderColor: 'transparent',
  borderRadius: 'lg',
  w: { base: '44px', sm: '52px' },
  h: { base: '52px', sm: '60px' },
  fontSize: 'xl',
  fontWeight: 'semibold',
  color: 'fg.strong',
  _hover: { bg: 'bg.mutedHover' },
  _focus: { bg: 'bg.muted', borderColor: 'border.focus' },
  sx: { fontVariantNumeric: 'tabular-nums' },
} as const;

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
  const firstBoxRef = useRef<HTMLInputElement>(null);

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

  // Runs from the button, and on its own once the last digit is in.
  const verify = async (entered = code) => {
    if (loading) return;
    if (!CODE_PATTERN.test(entered)) {
      setError(`Enter the ${LOGIN_CODE_LENGTH}-digit code from the email.`);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await verifyCode(email.trim(), entered);
    setLoading(false);
    if (result.error) {
      setError('That code didn’t work. Check it, or send a new one: codes expire after an hour.');
      // Start over from the first box, rather than editing one digit.
      setCode('');
      requestAnimationFrame(() => firstBoxRef.current?.focus());
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
              <Box role="group" aria-labelledby="login-code-label">
                <Text id="login-code-label" fontSize="sm" fontWeight="medium" color="fg.default" mb={2}>
                  Code
                </Text>
                {/* otp: the number pad, and the code offered from the email on
                    phones; a pasted or autofilled code fills every box. */}
                <HStack spacing={{ base: 2, sm: 3 }}>
                  <PinInput
                    otp
                    // The app's field look: filled, with its dark focus edge, not Chakra's blue.
                    variant="filled"
                    focusBorderColor="border.focus"
                    type="number"
                    autoFocus
                    placeholder=""
                    value={code}
                    isDisabled={loading}
                    onChange={(value) => {
                      setCode(value);
                      setError(null);
                    }}
                    onComplete={(value) => void verify(value)}
                  >
                    {CODE_BOXES.map((index) => (
                      <PinInputField
                        key={index}
                        ref={index === 0 ? firstBoxRef : undefined}
                        aria-label={`Digit ${index + 1} of ${LOGIN_CODE_LENGTH}`}
                        {...codeBoxStyle}
                      />
                    ))}
                  </PinInput>
                </HStack>
              </Box>
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
