// src/App.tsx
import { WalletProvider } from "@mysten/dapp-kit";
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import { ConnectButton } from "@mysten/dapp-kit";

const { networkConfig } = createNetworkConfig({
  localnet: { url: "https://fullnode.devnet.sui.io" },
});

const queryClient = new QueryClient();

export default function App() {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork="localnet">
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <div style={{ padding: 40 }}>
            <h1>Sui dApp Starter</h1>
            <ConnectButton />
          </div>
        </WalletProvider>
      </QueryClientProvider>
    </SuiClientProvider>
  );
}
