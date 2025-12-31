
import { GoogleGenAI, Type } from "@google/genai";
import { AIRoundData, GameMode, PlayerEffect, Player } from "../types.ts";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const LUCK_BLOCK_DATABASE_CSV = `Luck Block,Maçã Dourada Encantada,Benefício,Na próxima vez que perderia uma vida o jogador ignora completamente o dano
Luck Block,Poção de Fraqueza,Maléfício,Na próxima rodada o jogador perde duas vidas se errar
Luck Block,Totem do Vazio,Benefício,Se o jogador Morrer na próxima rodada ele pode voltar com 5 vidas
Luck Block,Azar Persistente,Maléfício,O jogador perde uma vida automaticamente no início da próxima rodada
Luck Block,Bênção do Oráculo,Benefício,O jogador pode errar uma vez sem punição
Luck Block,Imunidade Temporária,Benefício,O jogador fica imune a qualquer dano na próxima rodada
Luck Block,Efeito Dominó,Caos,Se o jogador perder vida na próxima rodada outro jogador aleatório também perde
Luck Block,Escudo Fantasma,Benefício,O primeiro erro do jogador nas próximas duas rodadas é ignorado
Luck Block,Coração Extra,Benefício,Ganha uma vida adicional 
Luck Block,Dano Refletido,Caos,Se o jogador perder vida na próxima rodada o Oráculo escolhe outro jogador para perder também`;

const parseLuckDatabase = (): Omit<PlayerEffect, 'id'>[] => {
    return LUCK_BLOCK_DATABASE_CSV.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
            const parts = line.split(',');
            return {
                name: parts[1].trim(),
                type: parts[2].trim() as any,
                description: parts[3].trim()
            };
        });
};

export const generateAIRound = async (usedItems: string[], luckBlockAppeared: boolean, players: Player[]): Promise<AIRoundData> => {
    try {
        const ai = getAI();
        const luckChance = luckBlockAppeared ? 0.05 : 0.12;
        const isLuckRound = Math.random() < luckChance;

        if (isLuckRound) {
            const luckDb = parseLuckDatabase();
            const luckOutcomes: Record<string, PlayerEffect> = {};
            players.forEach(p => {
                if (p.lives > 0 && !p.isHost) {
                    const effect = luckDb[Math.floor(Math.random() * luckDb.length)];
                    luckOutcomes[p.id] = { ...effect, id: Math.random().toString(36).substr(2, 9) };
                }
            });

            return {
                mode: 'Luck Block',
                items: [],
                itemIds: [],
                theme: 'EVENTO: LUCK BLOCK!',
                description: 'Todos ganham um efeito aleatório. Quebre o bloco para descobrir seu destino!',
                difficulty: 'médio',
                luckOutcomes
            };
        }

        const modes: GameMode[] = [
          'Tema da Sorte', 'Mob Misterioso', 'Bioma do Destino', 'Drop da Morte', 
          'Forno Profético', 'Mentira do Oráculo', 'Craft Fatal', 'Veio Amaldiçoado',
          'Ferramenta Amaldiçoada', 'Toque do Oráculo'
        ];
        const selectedMode = modes[Math.floor(Math.random() * modes.length)];
        const isWritingMode = selectedMode === 'Tema da Sorte';

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é o Oráculo de Minecraft. Gere uma rodada para o modo: "${selectedMode}".
            
            REGRAS OBRIGATÓRIAS:
            1. Se o modo for "Tema da Sorte", retorne obrigatoriamente "items": []. O tema deve ser amplo como "Algo que queima" ou "Um bloco de construção".
            2. Para qualquer outro modo, retorne exatamente 4 itens reais de Minecraft em "items".
            3. Responda APENAS com o objeto JSON abaixo. Sem textos extras.

            {
              "theme": "Nome do Tema Curto",
              "description": "Instrução de 1 frase",
              "items": ["Item1", "Item2", "Item3", "Item4"],
              "difficulty": "médio"
            }`,
            config: {
                responseMimeType: 'application/json',
            }
        });

        let rawText = response.text || "{}";
        // Limpeza agressiva de markdown ou textos extras
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            rawText = jsonMatch[0];
        }

        const result = JSON.parse(rawText);
        
        // Garante integridade se o modelo falhar em seguir o modo
        const finalItems = isWritingMode ? [] : (result.items || []);

        return {
            ...result,
            mode: selectedMode,
            items: finalItems,
            itemIds: finalItems.map(() => Math.random().toString(36).substr(2, 9))
        };
    } catch (error) {
        console.error("AI Error:", error);
        return {
            mode: 'Mob Misterioso',
            theme: 'Erro no Oráculo',
            description: 'Ocorreu uma falha na conexão. Escolha uma das defesas clássicas.',
            items: ['Picareta', 'Espada', 'Tocha', 'Pão'],
            itemIds: ['f1', 'f2', 'f3', 'f4'],
            difficulty: 'fácil'
        };
    }
};
