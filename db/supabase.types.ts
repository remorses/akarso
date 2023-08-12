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
      Site: {
        Row: {
          createdAt: string
          name: string
          orgId: string
          siteId: string
        }
        Insert: {
          createdAt?: string
          name: string
          orgId: string
          siteId: string
        }
        Update: {
          createdAt?: string
          name?: string
          orgId?: string
          siteId?: string
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

