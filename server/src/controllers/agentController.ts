import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

/**
 * GET /api/agents
 * Fetch all registered real estate agents with their profile information
 */
export const getAgents = async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma as PrismaClient;

    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        agentProfile: {
          select: {
            licenseNumber: true,
            yearsExperience: true,
            rating: true,
            agencyName: true,
            totalSales: true,
            specializations: true,
          },
        },
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      data: agents,
      meta: {
        total: agents.length,
      },
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agent profiles' });
  }
};

/**
 * GET /api/agents/:id
 * Fetch a single agent by ID with their active property listings
 */
export const getAgentById = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    const prisma = (req as any).prisma as PrismaClient;

    const agent = await prisma.user.findFirst({
      where: {
        id,
        role: 'AGENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        agentProfile: {
          select: {
            licenseNumber: true,
            yearsExperience: true,
            rating: true,
            agencyName: true,
            totalSales: true,
            specializations: true,
          },
        },
        properties: {
          where: { status: 'AVAILABLE' },
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.status(200).json({ data: agent });
  } catch (error) {
    console.error('Get agent by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch agent details' });
  }
};
