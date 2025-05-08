import torch
import torch.nn.functional as F

def predict_links(x, model, link_predictor, source, targets, id_map):
    link_map = {
        0: "friends",
        1: "influence",
        2: "feedback",
        3: "more_time",
        4: "advice",
        5: "disrespect",
        6: "no_link"
    }

    # build reverse map: internal idx → real student ID
    rev_map = {idx: real_id for real_id, idx in id_map.items()}

    model.eval()
    link_predictor.eval()
    with torch.no_grad():
        emb = model(x)  # distilled MLP branch
        src_emb = emb[source].unsqueeze(0)
        real_source = rev_map[source]
        results = []

        for tgt in targets:
            tgt_emb = emb[tgt].unsqueeze(0)
            logits = link_predictor(src_emb, tgt_emb)        # [1, num_relations]
            probs  = F.softmax(logits, dim=1).squeeze(0)     # [num_relations]
            pred_idx = probs.argmax().item()
            pred_type = link_map[pred_idx]

            real_tgt   = rev_map[tgt]
            pred_prob  = probs[pred_idx].item()
            
            if pred_prob >= 0.75 and pred_type != "no_link":
                results.append({
                    'source': real_source,
                    'target': real_tgt,
                    'link_type': pred_type,
                    'probability': round(pred_prob,2)
                })

    return results
