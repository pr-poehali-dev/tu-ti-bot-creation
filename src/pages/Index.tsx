import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
}

interface BotSettings {
  name: string;
  avatar: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я TuTiBot. Чем могу помочь?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    name: 'TuTiBot',
    avatar: '',
  });
  const [tempSettings, setTempSettings] = useState<BotSettings>(botSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (text: string, image?: string) => {
    if (!text.trim() && !image) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      image,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(scrollToBottom, 100);

    try {
      const response = await fetch('https://functions.poehali.dev/2abb66a4-abe8-425c-9926-972abc39a39a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          ...(image && { image }),
        }),
      });

      const data = await response.json();

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || 'Произошла ошибка',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Не удалось получить ответ. Проверь подключение.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage(inputValue || 'Отправил изображение', reader.result as string);
        setInputValue('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings({ ...tempSettings, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    setBotSettings(tempSettings);
    toast.success('Настройки сохранены');
  };

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        text: `Привет! Я ${botSettings.name}. Чем могу помочь?`,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    toast.success('Чат перезапущен');
  };

  const newChat = () => {
    setMessages([]);
    toast.success('Новый чат создан');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={botSettings.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {botSettings.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-foreground">{botSettings.name}</h1>
            <p className="text-xs text-muted-foreground">онлайн</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Icon name="Settings" size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Настройки бота</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Никнейм бота</Label>
                  <Input
                    id="bot-name"
                    value={tempSettings.name}
                    onChange={(e) => setTempSettings({ ...tempSettings, name: e.target.value })}
                    placeholder="Введите имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Аватар бота</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={tempSettings.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {tempSettings.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon name="Upload" size={16} className="mr-2" />
                      Загрузить фото
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
                <Button onClick={saveSettings} className="w-full">
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={newChat}>
            <Icon name="Plus" size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={resetChat}>
            <Icon name="RotateCcw" size={20} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card text-card-foreground border border-border rounded-bl-sm'
              }`}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="rounded-lg mb-2 max-w-full"
                />
              )}
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'user'
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                }`}
              >
                {message.timestamp.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            className="shrink-0"
          >
            <Icon name="Paperclip" size={20} />
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Сообщение..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon" className="shrink-0">
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;