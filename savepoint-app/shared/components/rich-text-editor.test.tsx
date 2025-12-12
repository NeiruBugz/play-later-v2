import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  isContentEmpty,
  MAX_CHARACTERS,
  stripHtmlTags,
} from "@/shared/lib/rich-text";

import { RichTextEditor } from "./rich-text-editor";

// Mock Tiptap to avoid issues with SSR and Node.js v22 compatibility
const mockUseEditor = vi.hoisted(() => vi.fn());
vi.mock("@tiptap/react", () => ({
  useEditor: mockUseEditor,
  EditorContent: ({ editor }: { editor: any }) => (
    <div
      data-testid="editor-content"
      data-editor={editor ? "present" : "absent"}
    />
  ),
}));

vi.mock("@tiptap/starter-kit", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock("@tiptap/extension-character-count", () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

const elements = {
  getBoldButton: () => screen.getByRole("button", { name: /bold/i }),
  getItalicButton: () => screen.getByRole("button", { name: /italic/i }),
  getBulletListButton: () =>
    screen.getByRole("button", { name: /bullet list/i }),
  getOrderedListButton: () =>
    screen.getByRole("button", { name: /numbered list/i }),
  getCharacterCounter: () => screen.getByText(/remaining|over limit/i),
  getEditorContent: () => screen.getByTestId("editor-content"),
  getPlaceholder: () => screen.queryByText(/write your journal entry/i),
};

describe("RichTextEditor", () => {
  let mockEditor: any;
  let mockOnChange: (html: string) => void;
  let mockOnValidationChange: (isValid: boolean) => void;
  let mockOnUpdate: (args: { editor: any }) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn<(html: string) => void>();
    mockOnValidationChange = vi.fn<(isValid: boolean) => void>();

    // Create a mock editor object
    mockEditor = {
      getHTML: vi.fn(() => "<p></p>"),
      getText: vi.fn(() => ""),
      chain: vi.fn(() => mockEditor),
      focus: vi.fn(() => mockEditor),
      toggleBold: vi.fn(() => mockEditor),
      toggleItalic: vi.fn(() => mockEditor),
      toggleBulletList: vi.fn(() => mockEditor),
      toggleOrderedList: vi.fn(() => mockEditor),
      run: vi.fn(),
      commands: {
        setContent: vi.fn(),
      },
      isActive: vi.fn(() => false),
      storage: {
        characterCount: {
          characters: vi.fn(() => 0),
        },
      },
      on: vi.fn(),
      off: vi.fn(),
    };

    // Mock useEditor to return the mock editor and capture onUpdate callback
    mockUseEditor.mockImplementation((config: any) => {
      mockOnUpdate = config.onUpdate;
      return mockEditor;
    });
  });

  describe("given component rendered with empty value", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <RichTextEditor value="" onChange={mockOnChange} />
      );
    });

    it("should display placeholder", () => {
      expect(elements.getPlaceholder()).toBeVisible();
    });

    it("should display character counter", () => {
      expect(elements.getCharacterCounter()).toBeVisible();
      expect(elements.getCharacterCounter()).toHaveTextContent(
        `${MAX_CHARACTERS} remaining`
      );
    });
  });

  describe("given component rendered with value", () => {
    beforeEach(() => {
      mockEditor.getHTML.mockReturnValue("<p>Test content</p>");
      mockEditor.getText.mockReturnValue("Test content");

      renderWithTestProviders(
        <RichTextEditor value="<p>Test content</p>" onChange={mockOnChange} />
      );
    });

    it("should not display placeholder", () => {
      expect(elements.getPlaceholder()).not.toBeInTheDocument();
    });

    it("should call onChange when editor content changes", async () => {
      // Simulate editor update
      if (mockOnUpdate) {
        mockOnUpdate({ editor: mockEditor });

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe("formatting buttons", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <RichTextEditor value="" onChange={mockOnChange} />
      );
    });

    it("should have bold button", () => {
      expect(elements.getBoldButton()).toBeVisible();
    });

    it("should have italic button", () => {
      expect(elements.getItalicButton()).toBeVisible();
    });

    it("should have bullet list button", () => {
      expect(elements.getBulletListButton()).toBeVisible();
    });

    it("should have ordered list button", () => {
      expect(elements.getOrderedListButton()).toBeVisible();
    });

    it("should toggle bold when bold button is clicked", async () => {
      await userEvent.click(elements.getBoldButton());

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.toggleBold).toHaveBeenCalled();
      expect(mockEditor.run).toHaveBeenCalled();
    });

    it("should toggle italic when italic button is clicked", async () => {
      await userEvent.click(elements.getItalicButton());

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.toggleItalic).toHaveBeenCalled();
      expect(mockEditor.run).toHaveBeenCalled();
    });

    it("should toggle bullet list when bullet list button is clicked", async () => {
      await userEvent.click(elements.getBulletListButton());

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.toggleBulletList).toHaveBeenCalled();
      expect(mockEditor.run).toHaveBeenCalled();
    });

    it("should toggle ordered list when ordered list button is clicked", async () => {
      await userEvent.click(elements.getOrderedListButton());

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.toggleOrderedList).toHaveBeenCalled();
      expect(mockEditor.run).toHaveBeenCalled();
    });
  });

  describe("character limit", () => {
    it("should display remaining characters when under limit", () => {
      mockEditor.storage.characterCount.characters.mockReturnValue(100);

      renderWithTestProviders(
        <RichTextEditor value="" onChange={mockOnChange} />
      );

      expect(elements.getCharacterCounter()).toHaveTextContent("900 remaining");
    });

    it("should display over limit message when over limit", () => {
      mockEditor.storage.characterCount.characters.mockReturnValue(1050);

      renderWithTestProviders(
        <RichTextEditor value="" onChange={mockOnChange} />
      );

      expect(elements.getCharacterCounter()).toHaveTextContent("50 over limit");
    });

    it("should call onValidationChange with false when over limit", async () => {
      mockEditor.getHTML.mockReturnValue("<p>" + "a".repeat(1001) + "</p>");
      mockEditor.storage.characterCount.characters.mockReturnValue(1001);

      renderWithTestProviders(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      if (mockOnUpdate) {
        mockOnUpdate({ editor: mockEditor });

        await waitFor(() => {
          expect(mockOnValidationChange).toHaveBeenCalledWith(false);
        });
      }
    });
  });

  describe("disabled state", () => {
    beforeEach(() => {
      renderWithTestProviders(
        <RichTextEditor value="" onChange={mockOnChange} disabled />
      );
    });

    it("should disable all toolbar buttons", () => {
      expect(elements.getBoldButton()).toBeDisabled();
      expect(elements.getItalicButton()).toBeDisabled();
      expect(elements.getBulletListButton()).toBeDisabled();
      expect(elements.getOrderedListButton()).toBeDisabled();
    });
  });

  describe("edit mode", () => {
    it("should update editor content when value prop changes", () => {
      const { rerender } = renderWithTestProviders(
        <RichTextEditor value="<p>Initial</p>" onChange={mockOnChange} />
      );

      mockEditor.getHTML.mockReturnValue("<p>Initial</p>");

      rerender(
        <RichTextEditor value="<p>Updated</p>" onChange={mockOnChange} />
      );

      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(
        "<p>Updated</p>"
      );
    });
  });
});

describe("stripHtmlTags", () => {
  it("should remove HTML tags", () => {
    expect(stripHtmlTags("<p>Hello</p>")).toBe("Hello");
  });

  it("should handle nested tags", () => {
    expect(stripHtmlTags("<p><strong>Bold</strong> text</p>")).toBe(
      "Bold text"
    );
  });

  it("should replace &nbsp; with space", () => {
    expect(stripHtmlTags("<p>Hello&nbsp;World</p>")).toBe("Hello World");
  });

  it("should remove HTML entities", () => {
    expect(stripHtmlTags("<p>Hello&nbsp;&amp;World</p>")).toBe("Hello World");
  });

  it("should trim whitespace", () => {
    expect(stripHtmlTags("  <p>Hello</p>  ")).toBe("Hello");
  });

  it("should handle empty HTML", () => {
    expect(stripHtmlTags("<p></p>")).toBe("");
  });

  it("should handle lists", () => {
    expect(stripHtmlTags("<ul><li>Item 1</li><li>Item 2</li></ul>")).toBe(
      "Item 1Item 2"
    );
  });
});

describe("isContentEmpty", () => {
  it("should return true for empty HTML", () => {
    expect(isContentEmpty("<p></p>")).toBe(true);
  });

  it("should return true for HTML with only whitespace", () => {
    expect(isContentEmpty("<p>   </p>")).toBe(true);
  });

  it("should return false for HTML with content", () => {
    expect(isContentEmpty("<p>Hello</p>")).toBe(false);
  });

  it("should return false for HTML with formatted content", () => {
    expect(isContentEmpty("<p><strong>Bold</strong></p>")).toBe(false);
  });

  it("should return true for HTML with only formatting tags", () => {
    expect(isContentEmpty("<p><strong></strong></p>")).toBe(true);
  });
});

describe("MAX_CHARACTERS", () => {
  it("should be 1000", () => {
    expect(MAX_CHARACTERS).toBe(1000);
  });
});
