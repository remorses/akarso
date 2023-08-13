export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Org: {
        Row: {
          createdAt: string
          name: string
          orgId: string
          ssoProviderId: string | null
          stripeCustomerId: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          name?: string
          orgId: string
          ssoProviderId?: string | null
          stripeCustomerId?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          name?: string
          orgId?: string
          ssoProviderId?: string | null
          stripeCustomerId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Org_ssoProviderId_fkey"
            columns: ["ssoProviderId"]
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          }
        ]
      }
      OrgInviteLink: {
        Row: {
          createdAt: string
          forSiteId: string | null
          key: string
          orgId: string
        }
        Insert: {
          createdAt?: string
          forSiteId?: string | null
          key: string
          orgId: string
        }
        Update: {
          createdAt?: string
          forSiteId?: string | null
          key?: string
          orgId?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrgInviteLink_orgId_fkey"
            columns: ["orgId"]
            referencedRelation: "Org"
            referencedColumns: ["orgId"]
          }
        ]
      }
      OrgsUsers: {
        Row: {
          orgId: string
          role: Database["public"]["Enums"]["UserRole"]
          userId: string
        }
        Insert: {
          orgId: string
          role?: Database["public"]["Enums"]["UserRole"]
          userId: string
        }
        Update: {
          orgId?: string
          role?: Database["public"]["Enums"]["UserRole"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrgsUsers_orgId_fkey"
            columns: ["orgId"]
            referencedRelation: "Org"
            referencedColumns: ["orgId"]
          },
          {
            foreignKeyName: "OrgsUsers_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      PortalSession: {
        Row: {
          callbackUrl: string
          createdAt: string
          expiresAt: string
          hash: string
          identifier: string
          metadata: Json
          orgId: string
          secret: string
          slug: string
        }
        Insert: {
          callbackUrl: string
          createdAt?: string
          expiresAt: string
          hash: string
          identifier: string
          metadata?: Json
          orgId: string
          secret: string
          slug: string
        }
        Update: {
          callbackUrl?: string
          createdAt?: string
          expiresAt?: string
          hash?: string
          identifier?: string
          metadata?: Json
          orgId?: string
          secret?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "PortalSession_orgId_fkey"
            columns: ["orgId"]
            referencedRelation: "Org"
            referencedColumns: ["orgId"]
          },
          {
            foreignKeyName: "PortalSession_slug_fkey"
            columns: ["slug"]
            referencedRelation: "Site"
            referencedColumns: ["slug"]
          }
        ]
      }
      Site: {
        Row: {
          acsUrl: string
          color: string
          createdAt: string
          customDomain: string | null
          entityId: string
          logoUrl: string
          orgId: string
          relayState: string | null
          secret: string
          siteId: string
          slug: string
          ssoMappings: Json
          startUrl: string
          supabaseAccessToken: string | null
          supabaseProjectRef: string | null
          websiteUrl: string
        }
        Insert: {
          acsUrl?: string
          color?: string
          createdAt?: string
          customDomain?: string | null
          entityId?: string
          logoUrl?: string
          orgId: string
          relayState?: string | null
          secret: string
          siteId: string
          slug: string
          ssoMappings?: Json
          startUrl?: string
          supabaseAccessToken?: string | null
          supabaseProjectRef?: string | null
          websiteUrl?: string
        }
        Update: {
          acsUrl?: string
          color?: string
          createdAt?: string
          customDomain?: string | null
          entityId?: string
          logoUrl?: string
          orgId?: string
          relayState?: string | null
          secret?: string
          siteId?: string
          slug?: string
          ssoMappings?: Json
          startUrl?: string
          supabaseAccessToken?: string | null
          supabaseProjectRef?: string | null
          websiteUrl?: string
        }
        Relationships: [
          {
            foreignKeyName: "Site_orgId_fkey"
            columns: ["orgId"]
            referencedRelation: "Org"
            referencedColumns: ["orgId"]
          }
        ]
      }
      SSOConnection: {
        Row: {
          domain: string
          id: string
          identifier: string
          orgId: string
          ssoProviderId: string
        }
        Insert: {
          domain: string
          id: string
          identifier: string
          orgId: string
          ssoProviderId: string
        }
        Update: {
          domain?: string
          id?: string
          identifier?: string
          orgId?: string
          ssoProviderId?: string
        }
        Relationships: [
          {
            foreignKeyName: "SSOConnection_orgId_fkey"
            columns: ["orgId"]
            referencedRelation: "Org"
            referencedColumns: ["orgId"]
          }
        ]
      }
      Subscription: {
        Row: {
          createdAt: string
          email: string | null
          endsAt: string | null
          itemId: string | null
          orgId: string
          productId: string
          quantity: number
          status: Database["public"]["Enums"]["SubscriptionStatus"]
          subscriptionId: string
          variantId: string
          variantName: string | null
        }
        Insert: {
          createdAt?: string
          email?: string | null
          endsAt?: string | null
          itemId?: string | null
          orgId: string
          productId: string
          quantity?: number
          status: Database["public"]["Enums"]["SubscriptionStatus"]
          subscriptionId: string
          variantId: string
          variantName?: string | null
        }
        Update: {
          createdAt?: string
          email?: string | null
          endsAt?: string | null
          itemId?: string | null
          orgId?: string
          productId?: string
          quantity?: number
          status?: Database["public"]["Enums"]["SubscriptionStatus"]
          subscriptionId?: string
          variantId?: string
          variantName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Subscription_orgId_fkey"
            columns: ["orgId"]
            referencedRelation: "Org"
            referencedColumns: ["orgId"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      SubscriptionStatus:
        | "on_trial"
        | "active"
        | "paused"
        | "past_due"
        | "unpaid"
        | "cancelled"
        | "expired"
      UserRole: "ADMIN" | "MEMBER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

