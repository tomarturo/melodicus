import { useState, type MouseEvent } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    VStack,
    Input,
    Text,
} from '@chakra-ui/react';
import { useAuth } from "./contexts/AuthContext";



interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleAuth = async (e: MouseEvent) => {
        e.preventDefault();
        setLoading(true);
    
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            onClose();
        } catch (error) {
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {isLogin ? "Login" : "Create Account"}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <VStack width="100%" spacing={4}>
                        <Button
                            colorScheme="blue"
                            width="100%"
                            onClick={handleAuth}
                            isLoading={loading}
                        >
                            {isLogin ? "Login" : "Sign Up"}
                        </Button>
                        <Text fontSize="sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Button
                                variant="link"
                                onClick={() => setIsLogin(!isLogin)}
                                color="blue.500"
                            >
                                {isLogin ? "Sign Up" : "Login"}
                            </Button>
                        </Text>
                    </VStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AuthModal;