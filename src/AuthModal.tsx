import { useState, type FormEvent } from 'react';
import {
  Button,
  FormControl,
  FormHelperText,
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

const COPY = {
  login: {
    title: 'Log in',
    intro: 'Pick up your songs and loops where you left off.',
    submit: 'Log in',
    busy: 'Logging in',
    failed: 'Couldn’t log in',
    switchPrompt: 'New to Melodicus?',
    switchAction: 'Create an account',
  },
  signup: {
    title: 'Create an account',
    intro: 'Keep your songs and loops, on any device.',
    submit: 'Create account',
    busy: 'Creating account',
    failed: 'Couldn’t create your account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Log in',
  },
} as const;

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, signup } = useAuth();
  const copy = COPY[mode];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = mode === 'login' ? await login(email, password) : await signup(email, password);
    setLoading(false);
    // On failure the dialog stays open, with what was typed, to try again.
    if (result.error) {
      setError(errorCause(result.error));
      return;
    }
    setPassword('');
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit} noValidate={false}>
        <ModalHeader pb={1}>{copy.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="fg.muted" mb={5}>
            {copy.intro}
          </Text>
          <Stack spacing={4}>
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
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" color="fg.default" requiredIndicator={<></>}>
                Password
              </FormLabel>
              <Input
                {...fieldStyle}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'signup' ? 6 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {mode === 'signup' && (
                <FormHelperText fontSize="xs" color="fg.muted" ml={4}>
                  At least 6 characters
                </FormHelperText>
              )}
            </FormControl>
            {error && (
              <Text role="alert" fontSize="sm" color="red.700">
                {copy.failed}. {error}
              </Text>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter flexDirection="column" gap={4} pt={6}>
          <Button type="submit" variant="loud" w="100%" isLoading={loading} loadingText={copy.busy}>
            {copy.submit}
          </Button>
          <Text fontSize="sm" color="fg.muted">
            {copy.switchPrompt}{' '}
            <Button
              variant="link"
              size="sm"
              color="fg.strong"
              fontWeight="semibold"
              textDecoration="underline"
              textUnderlineOffset="3px"
              onClick={switchMode}
            >
              {copy.switchAction}
            </Button>
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
