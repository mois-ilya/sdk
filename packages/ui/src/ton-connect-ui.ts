import type { Account } from '@tonconnect/sdk';
import {
    ITonConnect,
    SendTransactionRequest,
    SendTransactionResponse,
    TonConnect,
    TonConnectError,
    Wallet,
    WalletInfo,
    WalletInfoInjected
} from '@tonconnect/sdk';
import { widgetController } from 'src/app/widget-controller';
import { TonConnectUIError } from 'src/errors/ton-connect-ui.error';
import { TonConnectUiCreateOptions } from 'src/models/ton-connect-ui-create-options';
import { WalletInfoStorage } from 'src/storage';
import { isDevice } from 'src/app/styles/media';
import { getSystemTheme, openLink, subscribeToThemeChange } from 'src/app/utils/web-api';
import { TonConnectUiOptions } from 'src/models/ton-connect-ui-options';
import { setTheme } from 'src/app/state/theme-state';
import { mergeOptions } from 'src/app/utils/options';
import { setAppState } from 'src/app/state/app.state';
import { unwrap } from 'solid-js/store';
import { setLastSelectedWalletInfo } from 'src/app/state/modals-state';

export class TonConnectUI {
    public static getWallets(): Promise<WalletInfo[]> {
        return TonConnect.getWallets();
    }

    private readonly walletInfoStorage = new WalletInfoStorage();

    private readonly connector: ITonConnect;

    private _walletInfo: WalletInfo | null = null;

    private systemThemeChangeUnsubscribe: (() => void) | null = null;

    /**
     * Current connection status.
     */
    public get connected(): boolean {
        return this.connector.connected;
    }

    /**
     * Current connected account or null.
     */
    public get account(): Account | null {
        return this.connector.account;
    }

    /**
     * Curren connected wallet app or null.
     */
    public get wallet(): Wallet | null {
        return this.connector.wallet;
    }

    /**
     * Curren connected wallet's info or null.
     */
    public get walletInfo(): WalletInfo | null {
        return this._walletInfo;
    }

    /**
     * Set and apply new UI options. Object with partial options should be passed. Passed options will be merged with current options.
     * @param options
     */
    public set uiOptions(options: TonConnectUiOptions) {
        this.checkButtonRootExist(options.buttonRootId);

        if (options.theme === 'SYSTEM') {
            setTheme(getSystemTheme());

            if (!this.systemThemeChangeUnsubscribe) {
                this.systemThemeChangeUnsubscribe = subscribeToThemeChange(theme =>
                    setTheme(theme)
                );
            }
        } else {
            if (options.theme) {
                this.systemThemeChangeUnsubscribe?.();
                setTheme(options.theme);
            }
        }

        /* setThemeState(state =>
            mergeOptions({ theme, accentColor: options.accentColor }, unwrap(state))
        );*/

        setAppState(state => {
            const merged = mergeOptions(
                {
                    ...(options.language && { language: options.language }),
                    ...(options.buttonConfiguration && {
                        buttonConfiguration: options.buttonConfiguration
                    }),
                    ...(options.widgetConfiguration && {
                        widgetConfiguration: options.widgetConfiguration
                    })
                },
                unwrap(state)
            );

            if (options.buttonRootId !== undefined) {
                merged.buttonRootId = options.buttonRootId;
            }

            return merged;
        });
    }

    constructor(options?: TonConnectUiCreateOptions) {
        if (options && 'connector' in options && options.connector) {
            this.connector = options.connector;
        } else if (options && 'manifestUrl' in options && options.manifestUrl) {
            this.connector = new TonConnect({
                manifestUrl: options.manifestUrl,
                walletsListSource: options.walletsListSource
            });
        } else {
            throw new TonConnectUIError(
                'You have to specify a `manifestUrl` or a `connector` in the options.'
            );
        }

        this.getWallets();
        const rootId = this.normalizeWidgetRoot(options?.widgetRootId);

        this.subscribeToWalletChange();

        if (options?.restoreConnection !== false) {
            this.connector.restoreConnection().then(() => {
                if (!this.connector.connected) {
                    this.walletInfoStorage.removeWalletInfo();
                }
            });
        }

        this.uiOptions = options || {};
        setAppState({ connector: this.connector });

        widgetController.renderApp(rootId, this);
    }

    /**
     * Returns available wallets list.
     */
    public async getWallets(): Promise<WalletInfo[]> {
        return this.connector.getWallets();
    }

    /**
     * Subscribe to connection status change.
     * @return function which has to be called to unsubscribe.
     */
    public onStatusChange(
        callback: (wallet: (Wallet & WalletInfo) | null) => void,
        errorsHandler?: (err: TonConnectError) => void
    ): ReturnType<ITonConnect['onStatusChange']> {
        return this.connector.onStatusChange(wallet => {
            if (wallet) {
                const lastSelectedWalletInfo =
                    widgetController.getSelectedWalletInfo() ||
                    this.walletInfoStorage.getWalletInfo();

                callback({ ...wallet, ...lastSelectedWalletInfo! });
            } else {
                callback(wallet);
            }
        }, errorsHandler);
    }

    /**
     * Opens the modal window and handles a wallet connection.
     */
    public async connectWallet(): Promise<Wallet & WalletInfo> {
        const walletsList = await this.getWallets();
        const embeddedWallet: WalletInfoInjected = walletsList.find(
            wallet => 'embedded' in wallet && wallet.embedded
        ) as WalletInfoInjected;

        if (embeddedWallet) {
            setLastSelectedWalletInfo(embeddedWallet);
            this.connector.connect({ jsBridgeKey: embeddedWallet.jsBridgeKey });
        } else {
            widgetController.openWalletsModal();
        }

        return new Promise((resolve, reject) => {
            const unsubscribe = this.connector.onStatusChange(wallet => {
                unsubscribe!();
                if (wallet) {
                    const lastSelectedWalletInfo =
                        widgetController.getSelectedWalletInfo() ||
                        this.walletInfoStorage.getWalletInfo();

                    resolve({ ...wallet, ...lastSelectedWalletInfo! });
                } else {
                    reject(new TonConnectUIError('Wallet was not connected'));
                }
            }, reject);
        });
    }

    /**
     * Disconnect wallet and clean localstorage.
     */
    public disconnect(): Promise<void> {
        this.walletInfoStorage.removeWalletInfo();
        return this.connector.disconnect();
    }

    /**
     * Opens the modal window and handles the transaction sending.
     * @param tx transaction to send.
     * @param options modal and notifications behaviour settings. Default is show only 'before' modal and all notifications.
     */
    public async sendTransaction(
        tx: SendTransactionRequest,
        options?: {
            modals?: ('before' | 'success' | 'error')[];
            notifications?: ('before' | 'success' | 'error')[];
        }
    ): Promise<SendTransactionResponse> {
        if (!this.connected || !this.walletInfo) {
            throw new TonConnectUIError('Connect wallet to send a transaction.');
        }

        if (!isDevice('desktop') && 'universalLink' in this.walletInfo) {
            openLink(this.walletInfo.universalLink);
        }

        const notification = options?.notifications || ['before', 'success', 'error'];
        const modals = options?.modals || ['before'];

        widgetController.setAction({
            name: 'confirm-transaction',
            showNotification: notification.includes('before'),
            openModal: modals.includes('before')
        });

        try {
            const result = await this.connector.sendTransaction(tx);

            widgetController.setAction({
                name: 'transaction-sent',
                showNotification: notification.includes('success'),
                openModal: modals.includes('success')
            });

            return result;
        } catch (e) {
            widgetController.setAction({
                name: 'transaction-canceled',
                showNotification: notification.includes('error'),
                openModal: modals.includes('error')
            });

            if (e instanceof TonConnectError) {
                throw e;
            } else {
                console.error(e);
                throw new TonConnectUIError('Unhandled error:' + e);
            }
        } finally {
            widgetController.clearAction();
        }
    }

    private subscribeToWalletChange(): void {
        this.connector.onStatusChange(wallet => {
            if (wallet) {
                this.updateWalletInfo();
            } else {
                this.walletInfoStorage.removeWalletInfo();
            }
        });
    }

    private updateWalletInfo(): void {
        const lastSelectedWalletInfo = widgetController.getSelectedWalletInfo();

        if (lastSelectedWalletInfo) {
            this._walletInfo = lastSelectedWalletInfo;
            this.walletInfoStorage.setWalletInfo(lastSelectedWalletInfo);
        } else {
            this._walletInfo = this.walletInfoStorage.getWalletInfo();
        }
    }

    private normalizeWidgetRoot(rootId: string | undefined): string {
        if (!rootId || !document.getElementById(rootId)) {
            rootId = 'tc-widget-root';
            const rootElement = document.createElement('div');
            rootElement.id = rootId;
            document.body.appendChild(rootElement);
        }

        return rootId;
    }

    private checkButtonRootExist(buttonRootId: string | null | undefined): void | never {
        if (buttonRootId == null) {
            return;
        }

        if (!document.getElementById(buttonRootId)) {
            throw new TonConnectUIError(`${buttonRootId} element not found in the document.`);
        }
    }
}
