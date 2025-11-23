import electron from 'electron';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';

const { app, BrowserWindow } = electron;
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pythonProcess: ChildProcess | null = null;

// Enable remote module
app.on('browser-window-created', (_, window) => {
    require("@electron/remote/main").enable(window.webContents)
})

function startPythonBackend() {
    const backendDir = path.join(__dirname, '../../backend');
    const pythonPathWindows = path.join(backendDir, 'venv/Scripts/python.exe');
    const pythonPathUnix = path.join(backendDir, 'venv/bin/python');
    const pythonPath = process.platform === 'win32' ? pythonPathWindows : pythonPathUnix;

    console.log('Starting Python backend...');
    pythonProcess = spawn(pythonPath, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: backendDir,
        stdio: 'inherit'
    });

    pythonProcess.on('error', (err) => {
        console.error('Failed to start python process:', err);
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // enableRemoteModule is deprecated, handled via @electron/remote
        },
    });

    require("@electron/remote/main").enable(win.webContents)

    // Suppress CSP warning and allow blob/data for wavesurfer and Google Fonts
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:* blob: data: https://fonts.googleapis.com https://fonts.gstatic.com"]
            }
        });
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    require("@electron/remote/main").initialize();
    startPythonBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});