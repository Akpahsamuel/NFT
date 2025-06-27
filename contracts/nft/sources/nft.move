module nft::sui_nft {
    use sui::url::{Self, Url};
    use std::string;
    use sui::event;
    use sui::package;
    use sui::display;
    use sui::clock::{Self, Clock};


    /// SUI_NFT is a struct that represents a unique SUI NFT.
    public struct SUI_NFT has drop {}

    /// Sui_nft is a struct that represents an NFT object in the Sui blockchain.
    public struct Sui_nft has key, store {
        /// The unique identifier of the NFT.
        id: object::UID,
        /// The name of the NFT.
        name: string::String, 
        /// A short description of the NFT.
        description: string::String,
        /// The URL of the image associated with the NFT.
        image_url: Url,
        /// Walrus blob ID for the image (optional)
        walrus_blob_id: Option<string::String>,
        /// The timestamp when the NFT was minted (in milliseconds).
        minting_time: u64,
    }

    /// Mintnft_event is a struct that represents an event emitted when an NFT is minted.
    public struct Mintnft_event has copy, drop {
        /// The unique identifier of the object.
        object_id: object::ID,
        /// The address of the creator of the NFT.
        creator: address,
        /// The name of the NFT.
        name: string::String,
        /// The timestamp when the NFT was minted.
        minting_time: u64,
        /// Optional Walrus blob ID
        walrus_blob_id: Option<string::String>,
    }

     // Initializes the SUI NFT.
     //
     // This function initializes the SUI NFT by creating a new package and publishing it to the sender.
     // It also creates a new display object and publishes it to the sender.
     //
     // Args:
     // * `witness`: A SUI NFT.
     // * `ctx`: The transaction context.
     fun init(witness: SUI_NFT, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);

        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"creator"),
            string::utf8(b"minting_time"),
            string::utf8(b"walrus_blob_id")
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"Sui"),
            string::utf8(b"{minting_time}"),
            string::utf8(b"{walrus_blob_id}")
        ];

        let mut display = display::new_with_fields<Sui_nft>(
            &publisher, 
            keys,
            values,
            ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    /// Mints a new NFT object.
    ///
    /// This function mints a new NFT object and transfers it to the sender.
    ///
    /// Args:
    /// * `name`: The name of the NFT.
    /// * `description`: A short description of the NFT.
    /// * `image_url`: The URL of the image associated with the NFT.
    /// * `clock`: The clock object to get the current timestamp.
    /// * `ctx`: The transaction context.
    public entry fun mint(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        clock: &Clock,
        ctx: &mut tx_context::TxContext,
    ) {
        mint_with_walrus(name, description, image_url, option::none(), clock, ctx);
    }

    /// Mints a new NFT object with optional Walrus blob ID.
    ///
    /// This function mints a new NFT object and transfers it to the sender.
    ///
    /// Args:
    /// * `name`: The name of the NFT.
    /// * `description`: A short description of the NFT.
    /// * `image_url`: The URL of the image associated with the NFT.
    /// * `walrus_blob_id`: Optional Walrus blob ID for decentralized storage.
    /// * `clock`: The clock object to get the current timestamp.
    /// * `ctx`: The transaction context.
    public entry fun mint_with_walrus(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        walrus_blob_id: Option<vector<u8>>,
        clock: &Clock,
        ctx: &mut tx_context::TxContext,
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        let blob_id_option = if (option::is_some(&walrus_blob_id)) {
            option::some(string::utf8(*option::borrow(&walrus_blob_id)))
        } else {
            option::none()
        };
        
        let nft = Sui_nft {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            image_url: url::new_unsafe_from_bytes(image_url),
            walrus_blob_id: blob_id_option,
            minting_time: current_time,
        };

        let sender = tx_context::sender(ctx);

        event::emit(Mintnft_event {
            object_id: object::uid_to_inner(&nft.id),
            creator: sender,
            name: nft.name,
            minting_time: current_time,
            walrus_blob_id: blob_id_option,
        });

        transfer::public_transfer(nft, sender);
    }

    /// Updates the description of an NFT object.
    ///
    /// Args:
    /// * `nft`: The NFT object to be updated.
    /// * `new_description`: The new description of the NFT.
    public entry fun update_description(
        nft: &mut Sui_nft,
        new_description: vector<u8>,
    ) {
        nft.description = string::utf8(new_description);
    }

    /// Burns an NFT object.
    ///
    /// Args:
    /// * `nft`: The NFT object to be burned.
    public entry fun burn(nft: Sui_nft) {
        let Sui_nft { id, name: _, description: _, image_url: _, walrus_blob_id: _, minting_time: _ } = nft;
        object::delete(id);
    }

    /// Gets the minting time of an NFT.
    ///
    /// Args:
    /// * `nft`: The NFT object to query.
    /// 
    /// Returns:
    /// * The minting timestamp in milliseconds.
    public fun get_minting_time(nft: &Sui_nft): u64 {
        nft.minting_time
    }


    /// Gets the Walrus blob ID if it exists.
    ///
    /// Args:
    /// * `nft`: The NFT object to query.
    /// 
    /// Returns:
    /// * The Walrus blob ID if it exists.
    public fun get_walrus_blob_id(nft: &Sui_nft): Option<string::String> {
        nft.walrus_blob_id
    }
}