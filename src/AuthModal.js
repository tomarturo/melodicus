import React, { useState } from "react";
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



const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleAuth = async (e) => {
        e.preventDefault();
        console.log('handleAuth called with:', { email, password, isLogin }); // Debug log
        setLoading(true);
    
        try {
            if (isLogin) {
                console.log('Attempting login...'); // Debug log
                const result = await login(email, password);
                console.log('Login result:', result); // Debug log
            } else {
                console.log('Attempting signup...'); // Debug log
                const result = await signup(email, password);
                console.log('Signup result:', result); // Debug log
            }
            onClose();
        } catch (error) {
            console.error('Auth error:', error); // Debug log
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