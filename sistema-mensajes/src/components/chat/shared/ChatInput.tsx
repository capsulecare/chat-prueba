import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X } from 'lucide-react'; // Importa 'X' para el botón de eliminar
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'; 

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  onInputChange?: () => void;
  // onFileSelect ahora podría ser más específico o manejar los archivos aquí mismo
  // Si deseas que el componente padre reciba los archivos cuando se seleccionan
  // y también cuando se envían, mantén esta prop.
  // Para la visualización básica, manejaremos los archivos internamente.
  // onFileSelect?: (files: FileList | null) => void; 
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  onInputChange,
  // onFileSelect // Ya no lo usaremos directamente aquí para el manejo interno
}) => {
  const [message, setMessage] = useState('');
  // NUEVO ESTADO: Para almacenar los archivos seleccionados
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); 

  const emojiPickerRef = useRef<HTMLDivElement>(null); 
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFiles.length > 0) && !disabled) { // Permite enviar si hay mensaje o archivos
      onSendMessage(message.trim()); // Envía el mensaje de texto
      // Aquí, en un escenario real, también enviarías los selectedFiles a tu backend
      // mediante una función prop o una llamada API. Por ahora, solo los limpiaremos.
      
      setMessage('');
      setSelectedFiles([]); // Limpia los archivos después de enviar
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Limpia el valor del input file
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (onInputChange) {
      onInputChange();
    }
  };

  const handlePaperclipClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // MODIFICADO: Ahora guarda los archivos en el estado local
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convierte FileList a un array y lo guarda en el estado
      setSelectedFiles(Array.from(e.target.files)); 
      // Ya no necesitamos e.target.value = ''; aquí, porque no queremos que se "limpie" el input visualmente,
      // sino que el estado `selectedFiles` controle la visualización.
      // Puedes pasar los archivos al padre si necesitas notificarlos inmediatamente
      // if (onFileSelect) {
      //   onFileSelect(e.target.files);
      // }
    }
  };

  // NUEVA FUNCIÓN: Para eliminar un archivo de la lista de seleccionados
  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles((prevFiles) => prevFiles.filter(file => file.name !== fileName));
    // Si se eliminan todos los archivos, también podrías resetear el input file si lo deseas.
    // Aunque no es estrictamente necesario, ya que el estado `selectedFiles` es la fuente de verdad.
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);


  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* SECCIÓN NUEVA: Mostrar archivos seleccionados */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 p-2 border border-gray-300 rounded-lg bg-gray-50 max-h-24 overflow-y-auto">
          {selectedFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between text-sm text-gray-700 py-1 px-2 bg-white rounded-md mb-1 last:mb-0 shadow-sm">
              <span className="truncate mr-2">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(file.name)}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                title={`Eliminar ${file.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 max-h-32 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            multiple
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={disabled}
              onClick={handlePaperclipClick}
            >
              <Paperclip className="w-4 h-4 cursor-pointer" />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={disabled}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              ref={emojiButtonRef}
            >
              <Smile className="w-4 h-4 cursor-pointer" />
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={(!message.trim() && selectedFiles.length === 0) || disabled} // Deshabilita si no hay mensaje ni archivos
          className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-10"> 
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
};