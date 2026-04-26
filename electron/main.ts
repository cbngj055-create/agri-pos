import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'نظام المتجر الزراعي',
    icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // Build menu
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'ملف',
      submenu: [
        { label: 'فاتورة جديدة', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('navigate', '/app/invoice') },
        { type: 'separator' },
        { label: 'خروج', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'تعديل',
      submenu: [
        { role: 'undo', label: 'تراجع' },
        { role: 'redo', label: 'إعادة' },
        { type: 'separator' },
        { role: 'cut', label: 'قص' },
        { role: 'copy', label: 'نسخ' },
        { role: 'paste', label: 'لصق' },
        { role: 'selectAll', label: 'تحديد الكل' },
      ],
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'reload', label: 'إعادة تحميل' },
        { role: 'forceReload', label: 'إعادة تحميل إجبارية' },
        { role: 'toggleDevTools', label: 'أدوات المطور' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'حجم عادي' },
        { role: 'zoomIn', label: 'تكبير' },
        { role: 'zoomOut', label: 'تصغير' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'شاشة كاملة' },
      ],
    },
    {
      label: 'مساعدة',
      submenu: [
        { label: 'عن النظام', click: () => shell.openExternal('https://agri-pos.com') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
