// src/App.tsx
import { 
  WalletProvider,
  SuiClientProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import SuiNFTMinter from "./pages/main/Home/Home";

const { networkConfig } = createNetworkConfig({
  devnet: { url: "https://fullnode.devnet.sui.io" },
  testnet: { url: "https://fullnode.testnet.sui.io" },
  mainnet: { url: "https://fullnode.mainnet.sui.io" },
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
          <SuiNFTMinter />
        </WalletProvider>
      </QueryClientProvider>
    </SuiClientProvider>
  );
}