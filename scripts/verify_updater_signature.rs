use base64::{Engine,engine::general_purpose::STANDARD};
use minisign_verify::{PublicKey,Signature};
fn main(){
 let args:Vec<String>=std::env::args().collect();
 let config:serde_json::Value=serde_json::from_slice(&std::fs::read(&args[1]).unwrap()).unwrap();
 let key=String::from_utf8(STANDARD.decode(config["plugins"]["updater"]["pubkey"].as_str().unwrap()).unwrap()).unwrap();
 let pk=PublicKey::decode(&key).unwrap();
 let sig_file=std::fs::read_to_string(&args[3]).unwrap();
 let sig=Signature::decode(&String::from_utf8(STANDARD.decode(sig_file.trim()).unwrap()).unwrap()).unwrap();
 let mut data=std::fs::read(&args[2]).unwrap();pk.verify(&data,&sig,false).expect("signature rejected");
 data[0]^=1;assert!(pk.verify(&data,&sig,false).is_err(),"tampered artifact accepted");
 println!("Updater signature valid against configured public key; tampered artifact rejected");
}
