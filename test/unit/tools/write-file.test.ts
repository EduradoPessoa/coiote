import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { writeFileTool } from '../../../src/tools/filesystem/write-file.js';
import type { ToolContext } from '../../../src/tools/types.js';
import fs from 'fs-extra';
import path from 'path';

describe('writeFileTool', () => {
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
                outputFile: vi.fn(),
                writeFile: vi.fn(),
            }
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('escreve um arquivo pedindo confirmação do permissionManager', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(false as never);
        vi.mocked(ctx.permissionManager.request).mockResolvedValue(true as never);

        const result = await writeFileTool.execute({ path: 'new-file.ts', content: 'hello' }, ctx);

        expect(result.success).toBe(true);
        expect(ctx.permissionManager.request).toHaveBeenCalledWith(expect.objectContaining({
            tool: 'write_file',
            path: 'new-file.ts',
            isOverwrite: false
        }));
        expect(fs.outputFile).toHaveBeenCalledWith(path.resolve('/mock/root', 'new-file.ts'), 'hello', 'utf-8');
    });

    it('cancela a escrita caso o usuário negue permissão', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(true as never);
        vi.mocked(ctx.permissionManager.request).mockResolvedValue(false as never); // Usuário nega

        const result = await writeFileTool.execute({ path: 'existing.ts', content: 'new data' }, ctx);

        expect(result.success).toBe(false);
        expect(result.error).toContain('cancelada pelo usuário');
        expect(fs.outputFile).not.toHaveBeenCalled();
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('bloqueia path traversal na escrita', async () => {
        await expect(
            writeFileTool.execute({ path: '../../etc/passwd', content: 'hacked' }, ctx)
        ).rejects.toThrow('Path traversal detectado');
    });
});
