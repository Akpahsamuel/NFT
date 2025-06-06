// src/App.tsx
import { 
  WalletProvider,
  SuiClientProvider,
  createNetworkConfig,
  ConnectButton
} from "@mysten/dapp-kit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  devnet: { url: "https://fullnode.devnet.sui.io" },
});

const queryClient = new QueryClient();

export default function App() {
  return (
    <SuiClientProvider 
      networks={networkConfig} 
      defaultNetwork="devnet"
    >
      <QueryClientProvider client={queryClient}>
        <WalletProvider
          autoConnect={true}
          slushWallet={{
            name: 'Sui dApp Starter',  // Your dApp name
          }}
        >
          <div style={{ padding: 40 }}>
            <h1>Sui dApp Starter</h1>
            <ConnectButton />
          </div>
        </WalletProvider>
      </QueryClientProvider>
    </SuiClientProvider>
  );
}