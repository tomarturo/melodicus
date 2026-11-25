import { useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SectionNameModal from './SectionNameModal';
import { theme } from './theme';

/** The dialog with its name held in state, as the player page holds it. */
function Harness({ initial = '' }: { initial?: string }) {
  const [name, setName] = useState(initial);
  return (
    <ChakraProvider theme={theme}>
      <SectionNameModal
        isOpen
        onClose={() => {}}
        isEditing={false}
        sectionName={name}
        onSectionNameChange={setName}
        onSave={() => {}}
        isSaving={false}
      />
    </ChakraProvider>
  );
}

const tap = (label: string) => fireEvent.click(screen.getByRole('button', { name: label }));
const nameField = () => screen.getByPlaceholderText<HTMLInputElement>('Loop name (optional)');

describe('SectionNameModal suggestions', () => {
  it('lists the parts people learn first, capitalized', () => {
    render(<Harness />);
    const first = ['Melody', 'Solo', 'Intro'];
    first.forEach((label) => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
  });

  it('starts a name capitalized and adds later words in lowercase', () => {
    render(<Harness />);
    tap('Verse');
    tap('Riff');
    expect(nameField().value).toBe('Verse riff');
  });

  it('keeps numbers and section letters as they are', () => {
    render(<Harness />);
    tap('Solo');
    tap('A');
    tap('2');
    expect(nameField().value).toBe('Solo A 2');
  });

  it('adds to a typed name with a single space', () => {
    render(<Harness initial="Last " />);
    tap('Chorus');
    expect(nameField().value).toBe('Last chorus');
  });
});
