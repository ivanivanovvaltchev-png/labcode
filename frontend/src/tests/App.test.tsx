import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Gamified App Flow', () => {
    it('Renders the Login screen initially', () => {
        render(<App />);
        expect(screen.getByText(/Inicia tu Aventura/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Nombre de Valiente/i)).toBeInTheDocument();
    });

    it('Logs in and shows the Map and user stats', () => {
        render(<App />);

        const input = screen.getByPlaceholderText(/Nombre de Valiente/i);
        fireEvent.change(input, { target: { value: 'Tester' } });

        const loginBtn = screen.getByText(/Entrar al Mundo/i);
        fireEvent.click(loginBtn);

        // Navigation bar should now show the user and xp
        expect(screen.getByText('Tester')).toBeInTheDocument();
        expect(screen.getByText('0 XP')).toBeInTheDocument();

        // Ensure map is rendered
        expect(screen.getByText(/El Mapa de/i)).toBeInTheDocument();
    });
});
