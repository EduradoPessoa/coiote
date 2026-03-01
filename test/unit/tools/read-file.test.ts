import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileTool } from '../../../src/tools/filesystem/read-file.js';
import type { ToolContext } from '../../../src/tools/types.js';
import fs from 'fs-extra';
import path from 'path';

describe('readFileTool', () => {
    let ctx: ToolContext;

    beforeEach(() => {
        ctx = {
            projectRoot: '/mock/root',
            reporter: {
                toolCall: vi.fn(),
                toolResult: vi.fn(),
                error: vi.fn(),
                info: vi.fn(),
                warning: vi.fn(),
            },
            permissionManager: {
                request: vi.fn().mockResolvedValue(true),
                requestHighRisk: vi.fn().mockResolvedValue(true),
            },
            signal: new AbortController().signal,
        };

        vi.mock('fs-extra', () => ({
            default: {
                pathExists: vi.fn(),
                readFile: vi.fn(),
            }
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('lê um arquivo existente com sucesso', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(true as never);
        vi.mocked(fs.readFile).mockResolvedValue('conteúdo do arquivo' as never);

        const result = await readFileTool.execute({ path: 'src/file.ts' }, ctx);

        expect(result.success).toBe(true);
        expect(result.value).toBe('conteúdo do arquivo');
        expect(fs.pathExists).toHaveBeenCalledWith(path.resolve('/mock/root', 'src/file.ts'));
        expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/mock/root', 'src/file.ts'), 'utf-8');
    });

    it('falha ao tentar ler um arquivo inexistente', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(false as never);

        const result = await readFileTool.execute({ path: 'not-exists.ts' }, ctx);

        expect(result.success).toBe(false);
        expect(result.error).toContain('não existe');
        expect(fs.readFile).not.toHaveBeenCalled();
    });

    it('bloqueia path traversal', async () => {
        await expect(
            readFileTool.execute({ path: '../outside.ts' }, ctx)
        ).rejects.toThrow('Path traversal detectado');
    });

    it('bloqueia arquivo sensível', async () => {
        await expect(
            readFileTool.execute({ path: '.env' }, ctx)
        ).rejects.toThrow('arquivo sensível');
    });
});
